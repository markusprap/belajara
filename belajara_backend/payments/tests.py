import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from courses.models import Course
from users.services.mahasiswa_service import create_mahasiswa
from payments.models import Transaction

@pytest.mark.django_db
def test_payment_checkout_and_webhook():
    course_premium = Course.objects.create(
        code="IF404",
        title="Kriptografi Lanjut",
        sks=3,
        semester=6,
        department="Informatika",
        price=150000.00,
        is_premium=True
    )
    
    course_free = Course.objects.create(
        code="IF101",
        title="Pengenalan TI",
        sks=2,
        semester=1,
        department="Informatika",
        price=0.00,
        is_premium=False
    )

    student = create_mahasiswa(
        username="buyerstudent",
        password="buyerpass123",
        email="buyer@example.com",
        nim="33221100",
        jurusan="Informatika",
        universitas="UGM"
    )

    client = APIClient()
    login_url = reverse('token_obtain_pair')
    response = client.post(login_url, {"username": "buyerstudent", "password": "buyerpass123"}, format='json')
    access_token = response.data["access"]
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

    # 1. Test Checkout Free Course -> should fail
    checkout_url = reverse('payment_checkout')
    free_response = client.post(checkout_url, {"course_id": course_free.id}, format='json')
    assert free_response.status_code == status.HTTP_400_BAD_REQUEST
    assert "gratis" in free_response.data["detail"]

    # 2. Test Checkout Premium Course -> should succeed
    premium_response = client.post(checkout_url, {"course_id": course_premium.id}, format='json')
    assert premium_response.status_code == status.HTTP_201_CREATED
    assert "snap_token" in premium_response.data
    order_id = premium_response.data["order_id"]
    
    # 3. Test Checkout Double-Click -> should return 200 OK and same snap token
    duplicate_response = client.post(checkout_url, {"course_id": course_premium.id}, format='json')
    assert duplicate_response.status_code == status.HTTP_200_OK
    assert duplicate_response.data["order_id"] == order_id

    # Verify student not enrolled yet
    assert not student.active_courses.filter(id=course_premium.id).exists()

    # 4. Test Webhook Callback (settlement/success)
    webhook_url = reverse('payment_webhook')
    webhook_data = {
        "order_id": order_id,
        "transaction_status": "settlement",
        "fraud_status": "accept",
        "status_code": "200",
        "gross_amount": "150000.00",
        "signature_key": "dummy-signature"
    }
    
    webhook_response = client.post(webhook_url, webhook_data, format='json')
    assert webhook_response.status_code == status.HTTP_200_OK
    assert webhook_response.data["transaction_status"] == "success"

    # Verify student is now enrolled!
    student.refresh_from_db()
    assert student.active_courses.filter(id=course_premium.id).exists()
