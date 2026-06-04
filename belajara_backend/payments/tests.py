"""
Payment Tests — Belajara.

Covers:
- Per-course checkout (free course rejection, premium checkout, duplicate idempotency)
- Midtrans webhook handler (settlement, failure, idempotency)
- Subscription initiation (Scholar/Pro)
- Subscription status endpoint
- Subscription cancellation
"""
import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from courses.models import Course, Enrollment
from payments.models import Subscription, Transaction
from users.services.mahasiswa_service import create_mahasiswa


# ─── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture
def course_premium(db):
    return Course.objects.create(
        code="IF404",
        title="Kriptografi Lanjut",
        sks=3,
        semester=6,
        department="Informatika",
        price=150000.00,
        is_premium=True,
    )


@pytest.fixture
def course_free(db):
    return Course.objects.create(
        code="IF101",
        title="Pengenalan TI",
        sks=2,
        semester=1,
        department="Informatika",
        price=0.00,
        is_premium=False,
    )


@pytest.fixture
def mahasiswa(db):
    return create_mahasiswa(
        username="buyerstudent",
        password="buyerpass123",
        email="buyer@example.com",
        nim="33221100",
        jurusan="Informatika",
        universitas="UGM",
    )


@pytest.fixture
def auth_client(mahasiswa):
    client = APIClient()
    login_url = reverse("token_obtain_pair")
    response = client.post(
        login_url,
        {"username": "buyerstudent", "password": "buyerpass123"},
        format="json",
    )
    access_token = response.data["access"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
    return client


# ─── Per-Course Checkout Tests ────────────────────────────────────────────────

@pytest.mark.django_db
def test_checkout_free_course_rejected(auth_client, course_free):
    """Free course checkout should return 400."""
    url = reverse("payment_checkout")
    response = auth_client.post(url, {"course_id": course_free.id}, format="json")
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "gratis" in response.data["detail"]


@pytest.mark.django_db
def test_checkout_premium_course_creates_transaction(auth_client, mahasiswa, course_premium):
    """Premium course checkout should create a pending transaction."""
    url = reverse("payment_checkout")
    response = auth_client.post(url, {"course_id": course_premium.id}, format="json")
    assert response.status_code == status.HTTP_201_CREATED
    assert "snap_token" in response.data
    assert "order_id" in response.data
    assert response.data["transaction_type"] == "course_purchase"
    assert response.data["status"] == "pending"


@pytest.mark.django_db
def test_checkout_idempotent_returns_existing(auth_client, mahasiswa, course_premium):
    """Double-click on checkout should return the same existing pending transaction."""
    url = reverse("payment_checkout")
    r1 = auth_client.post(url, {"course_id": course_premium.id}, format="json")
    r2 = auth_client.post(url, {"course_id": course_premium.id}, format="json")

    assert r1.status_code == status.HTTP_201_CREATED
    assert r2.status_code == status.HTTP_200_OK
    assert r1.data["order_id"] == r2.data["order_id"]


@pytest.mark.django_db
def test_checkout_nonexistent_course(auth_client):
    """Checkout for a non-existent course should return 404."""
    url = reverse("payment_checkout")
    response = auth_client.post(url, {"course_id": 99999}, format="json")
    assert response.status_code == status.HTTP_404_NOT_FOUND


# ─── Webhook Tests ────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_webhook_settlement_enrolls_student(auth_client, mahasiswa, course_premium):
    """Settlement webhook should mark transaction success and enroll the student."""
    # Create a pending transaction
    checkout_url = reverse("payment_checkout")
    checkout_resp = auth_client.post(
        checkout_url, {"course_id": course_premium.id}, format="json"
    )
    assert checkout_resp.status_code == status.HTTP_201_CREATED
    order_id = checkout_resp.data["order_id"]

    # Verify student not enrolled yet
    assert not mahasiswa.active_courses.filter(id=course_premium.id).exists()

    # Send settlement webhook
    webhook_url = reverse("payment_webhook")
    webhook_data = {
        "order_id": order_id,
        "transaction_status": "settlement",
        "fraud_status": "accept",
        "status_code": "200",
        "gross_amount": "150000.00",
        "signature_key": "dummy-signature",  # bypassed in test (no real server key)
    }
    webhook_resp = auth_client.post(webhook_url, webhook_data, format="json")
    assert webhook_resp.status_code == status.HTTP_200_OK
    assert webhook_resp.data["transaction_status"] == "success"

    # Verify enrollment
    mahasiswa.refresh_from_db()
    assert mahasiswa.active_courses.filter(id=course_premium.id).exists()

    enrollment = Enrollment.objects.get(mahasiswa=mahasiswa, course=course_premium)
    assert enrollment.mode == "verified"


@pytest.mark.django_db
def test_webhook_failure_marks_transaction_failed(auth_client, mahasiswa, course_premium):
    """Cancel/expire webhook should mark the transaction as failed."""
    checkout_url = reverse("payment_checkout")
    checkout_resp = auth_client.post(
        checkout_url, {"course_id": course_premium.id}, format="json"
    )
    order_id = checkout_resp.data["order_id"]

    webhook_url = reverse("payment_webhook")
    webhook_data = {
        "order_id": order_id,
        "transaction_status": "cancel",
        "status_code": "202",
        "gross_amount": "150000.00",
        "signature_key": "dummy-signature",
    }
    webhook_resp = auth_client.post(webhook_url, webhook_data, format="json")
    assert webhook_resp.status_code == status.HTTP_200_OK
    assert webhook_resp.data["transaction_status"] == "failed"


@pytest.mark.django_db
def test_webhook_idempotency(auth_client, mahasiswa, course_premium):
    """Sending the same webhook twice should not re-process an already-final transaction."""
    checkout_url = reverse("payment_checkout")
    checkout_resp = auth_client.post(
        checkout_url, {"course_id": course_premium.id}, format="json"
    )
    order_id = checkout_resp.data["order_id"]

    webhook_url = reverse("payment_webhook")
    webhook_data = {
        "order_id": order_id,
        "transaction_status": "settlement",
        "fraud_status": "accept",
        "status_code": "200",
        "gross_amount": "150000.00",
        "signature_key": "dummy-signature",
    }
    r1 = auth_client.post(webhook_url, webhook_data, format="json")
    r2 = auth_client.post(webhook_url, webhook_data, format="json")

    assert r1.status_code == status.HTTP_200_OK
    assert r2.status_code == status.HTTP_200_OK
    assert r2.data.get("message") == "Already processed"


# ─── Subscription Tests ────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_subscribe_scholar_creates_pending(auth_client, mahasiswa):
    """Subscribing to Scholar tier should create a pending subscription and transaction."""
    url = reverse("payment_subscribe")
    response = auth_client.post(url, {"tier": "scholar"}, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    assert "snap_token" in response.data
    assert response.data["tier"] == "scholar"
    assert response.data["amount"] == 49000

    # Subscription record should exist in DB
    sub = Subscription.objects.filter(mahasiswa=mahasiswa).first()
    assert sub is not None
    assert sub.tier == "scholar"


@pytest.mark.django_db
def test_subscribe_pro_creates_pending(auth_client, mahasiswa):
    """Subscribing to Pro tier should create a pending subscription."""
    url = reverse("payment_subscribe")
    response = auth_client.post(url, {"tier": "pro"}, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["tier"] == "pro"
    assert response.data["amount"] == 99000


@pytest.mark.django_db
def test_subscribe_invalid_tier_rejected(auth_client):
    """Invalid tier should return 400."""
    url = reverse("payment_subscribe")
    response = auth_client.post(url, {"tier": "enterprise"}, format="json")
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_my_subscription_no_subscription(auth_client):
    """Student with no subscription should get has_subscription=False."""
    url = reverse("payment_my_subscription")
    response = auth_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["has_subscription"] is False
    assert response.data["subscription"] is None


@pytest.mark.django_db
def test_my_subscription_with_active(auth_client, mahasiswa):
    """Student with active subscription should see it in the response."""
    from datetime import timedelta

    sub = Subscription.objects.create(
        mahasiswa=mahasiswa,
        tier="scholar",
        status="active",
        current_period_start=timezone.now(),
        current_period_end=timezone.now() + timedelta(days=30),
    )

    url = reverse("payment_my_subscription")
    response = auth_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["has_subscription"] is True
    assert response.data["subscription"]["tier"] == "scholar"
    assert response.data["subscription"]["is_active"] is True


@pytest.mark.django_db
def test_cancel_subscription(auth_client, mahasiswa):
    """Cancelling an active subscription should set status to cancelled, but keep premium active."""
    from datetime import timedelta

    sub = Subscription.objects.create(
        mahasiswa=mahasiswa,
        tier="scholar",
        status="active",
        current_period_start=timezone.now(),
        current_period_end=timezone.now() + timedelta(days=30),
    )
    mahasiswa.user.is_premium = True
    mahasiswa.user.save()

    url = reverse("payment_cancel_subscription")
    response = auth_client.post(url)

    assert response.status_code == status.HTTP_200_OK
    assert "dibatalkan" in response.data["detail"]
    assert response.data["subscription"]["is_active"] is True
    assert response.data["subscription"]["status"] == "cancelled"

    sub.refresh_from_db()
    assert sub.status == "cancelled"
    assert sub.cancelled_at is not None

    mahasiswa.user.refresh_from_db()
    assert mahasiswa.user.is_premium is True


@pytest.mark.django_db
def test_cancel_subscription_no_active(auth_client):
    """Cancelling when no active subscription should return 404."""
    url = reverse("payment_cancel_subscription")
    response = auth_client.post(url)
    assert response.status_code == status.HTTP_404_NOT_FOUND


# ─── Webhook Subscription Activation Test ─────────────────────────────────────

@pytest.mark.django_db
def test_webhook_activates_subscription(auth_client, mahasiswa):
    """Settlement webhook for a subscription should activate it and grant is_premium."""
    from datetime import timedelta

    sub = Subscription.objects.create(
        mahasiswa=mahasiswa,
        tier="scholar",
        status="suspended",
        current_period_start=timezone.now(),
        current_period_end=timezone.now() + timedelta(days=30),
    )

    tx = Transaction.objects.create(
        order_id="SUB-TEST-ORDER-001",
        mahasiswa=mahasiswa,
        course=None,
        subscription=sub,
        amount=49000,
        status="pending",
        transaction_type="subscription_new",
    )

    webhook_url = reverse("payment_webhook")
    webhook_data = {
        "order_id": "SUB-TEST-ORDER-001",
        "transaction_status": "settlement",
        "fraud_status": "accept",
        "status_code": "200",
        "gross_amount": "49000",
        "signature_key": "dummy-signature",
        "saved_token_id": "mock-saved-token-xyz",
    }

    response = auth_client.post(webhook_url, webhook_data, format="json")
    assert response.status_code == status.HTTP_200_OK

    sub.refresh_from_db()
    assert sub.status == "active"
    assert sub.saved_token_id == "mock-saved-token-xyz"

    mahasiswa.user.refresh_from_db()
    assert mahasiswa.user.is_premium is True


@pytest.mark.django_db
def test_cancelled_subscription_expires_at_period_end(mahasiswa):
    """A cancelled subscription whose period is in the past should expire and revoke premium."""
    from datetime import timedelta
    from payments.tasks import expire_stale_subscriptions

    # Create a cancelled subscription that expired 1 hour ago
    sub = Subscription.objects.create(
        mahasiswa=mahasiswa,
        tier="scholar",
        status="cancelled",
        current_period_start=timezone.now() - timedelta(days=30),
        current_period_end=timezone.now() - timedelta(hours=1),
    )
    mahasiswa.user.is_premium = True
    mahasiswa.user.save()

    expire_stale_subscriptions()

    sub.refresh_from_db()
    assert sub.status == "expired"

    mahasiswa.user.refresh_from_db()
    assert mahasiswa.user.is_premium is False


@pytest.mark.django_db
def test_checkout_on_expired_subscription_resets_to_suspended(auth_client, mahasiswa):
    """Starting checkout on an expired active subscription resets its status to suspended."""
    from datetime import timedelta

    sub = Subscription.objects.create(
        mahasiswa=mahasiswa,
        tier="scholar",
        status="active",
        current_period_start=timezone.now() - timedelta(days=30),
        current_period_end=timezone.now() - timedelta(hours=1),  # Expired
    )
    mahasiswa.user.is_premium = True
    mahasiswa.user.save()

    url = reverse("payment_subscribe")
    response = auth_client.post(url, {"tier": "scholar"}, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["subscription"]["status"] == "suspended"
    assert response.data["subscription"]["is_active"] is False

    sub.refresh_from_db()
    assert sub.status == "suspended"

    # Verify user is_premium remains unchanged by checkout (wait for webhook to activate it)
    mahasiswa.user.refresh_from_db()
    assert mahasiswa.user.is_premium is True  # still premium until expire beat task runs


# ─── Hardening Webhook Tests ──────────────────────────────────────────────────

@pytest.mark.django_db
def test_webhook_missing_signature_in_production_rejected(auth_client, course_premium, monkeypatch):
    """Webhook without signature_key should be rejected with 400 in production mode."""
    # Force production mode
    monkeypatch.setenv("MIDTRANS_SERVER_KEY", "test-real-server-key-xyz")

    checkout_url = reverse("payment_checkout")
    checkout_resp = auth_client.post(checkout_url, {"course_id": course_premium.id}, format="json")
    order_id = checkout_resp.data["order_id"]

    webhook_url = reverse("payment_webhook")
    webhook_data = {
        "order_id": order_id,
        "transaction_status": "settlement",
        "fraud_status": "accept",
        "status_code": "200",
        "gross_amount": "150000.00",
    }
    response = auth_client.post(webhook_url, webhook_data, format="json")
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Tanda tangan tidak ditemukan" in response.data["detail"]


@pytest.mark.django_db
def test_webhook_invalid_signature_rejected(auth_client, course_premium, monkeypatch):
    """Webhook with invalid signature_key should be rejected with 400 in production mode."""
    monkeypatch.setenv("MIDTRANS_SERVER_KEY", "test-real-server-key-xyz")

    checkout_url = reverse("payment_checkout")
    checkout_resp = auth_client.post(checkout_url, {"course_id": course_premium.id}, format="json")
    order_id = checkout_resp.data["order_id"]

    webhook_url = reverse("payment_webhook")
    webhook_data = {
        "order_id": order_id,
        "transaction_status": "settlement",
        "fraud_status": "accept",
        "status_code": "200",
        "gross_amount": "150000.00",
        "signature_key": "wrong-signature-123456",
    }
    response = auth_client.post(webhook_url, webhook_data, format="json")
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Tanda tangan tidak valid" in response.data["detail"]


@pytest.mark.django_db
def test_webhook_amount_mismatch_rejected(auth_client, course_premium):
    """Webhook with mismatched gross_amount should be rejected with 400."""
    checkout_url = reverse("payment_checkout")
    checkout_resp = auth_client.post(checkout_url, {"course_id": course_premium.id}, format="json")
    order_id = checkout_resp.data["order_id"]

    webhook_url = reverse("payment_webhook")
    webhook_data = {
        "order_id": order_id,
        "transaction_status": "settlement",
        "fraud_status": "accept",
        "status_code": "200",
        "gross_amount": "999999.99", # Mismatched amount
        "signature_key": "dummy-sig",
    }
    response = auth_client.post(webhook_url, webhook_data, format="json")
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Jumlah pembayaran tidak sesuai" in response.data["detail"]


@pytest.mark.django_db
def test_user_transactions_api(auth_client, mahasiswa, course_premium):
    """Authenticated student should see their own transaction history."""
    url = reverse("payment_transactions")
    
    # 1. Initially should be empty
    response = auth_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 0

    # 2. Create a transaction
    Transaction.objects.create(
        order_id="BLJR-TX-TEST-001",
        mahasiswa=mahasiswa,
        course=course_premium,
        amount=150000.00,
        status="pending",
        transaction_type="course_purchase"
    )

    # 3. Retrieve transactions list
    response = auth_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 1
    assert response.data[0]["order_id"] == "BLJR-TX-TEST-001"
    assert float(response.data[0]["amount"]) == 150000.00
    assert response.data[0]["status"] == "pending"
    assert response.data[0]["transaction_type"] == "course_purchase"


