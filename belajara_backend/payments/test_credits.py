import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from users.models import User, InstructorProfile, AICreditTransaction
from payments.models import Transaction

@pytest.fixture
def instructor(db):
    user = User.objects.create_user(
        username="dosentest",
        password="dosenpass123",
        email="dosen@example.com",
        is_instructor=True,
    )
    return InstructorProfile.objects.create(
        user=user,
        nidn="98765432",
        bidang_keahlian="Sains",
        universitas="UI"
    )

@pytest.fixture
def student(db):
    from users.services.mahasiswa_service import create_mahasiswa
    return create_mahasiswa(
        username="studenttest",
        password="studentpass123",
        email="student@example.com",
        nim="11223344",
        jurusan="Teknik",
        universitas="UI"
    )

@pytest.fixture
def instructor_client(instructor):
    client = APIClient()
    login_url = reverse("token_obtain_pair")
    response = client.post(
        login_url,
        {"username": "dosentest", "password": "dosenpass123"},
        format="json",
    )
    access_token = response.data["access"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
    return client

@pytest.fixture
def student_client(student):
    client = APIClient()
    login_url = reverse("token_obtain_pair")
    response = client.post(
        login_url,
        {"username": "studenttest", "password": "studentpass123"},
        format="json",
    )
    access_token = response.data["access"]
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
    return client

@pytest.mark.django_db
def test_checkout_credits_by_student_rejected(student_client):
    url = reverse("payment_checkout_credits")
    response = student_client.post(url, {"package": "package_10"}, format="json")
    assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
def test_checkout_credits_by_instructor_creates_pending_transaction(instructor_client, instructor):
    url = reverse("payment_checkout_credits")
    response = instructor_client.post(url, {"package": "package_10"}, format="json")
    assert response.status_code == status.HTTP_201_CREATED
    assert "snap_token" in response.data
    assert response.data["transaction_type"] == "credit_purchase"
    assert response.data["status"] == "pending"
    assert float(response.data["amount"]) == 50000.00
    
    # Check DB transaction is created
    tx = Transaction.objects.get(order_id=response.data["order_id"])
    assert tx.instructor == instructor

@pytest.mark.django_db
def test_webhook_credit_purchase_settlement_grants_credits(instructor_client, instructor):
    url_checkout = reverse("payment_checkout_credits")
    resp_checkout = instructor_client.post(url_checkout, {"package": "package_50"}, format="json")
    assert resp_checkout.status_code == status.HTTP_201_CREATED
    order_id = resp_checkout.data["order_id"]

    # Initial credits should be 20 (default)
    assert instructor.ai_credits == 20

    url_webhook = reverse("payment_webhook")
    webhook_data = {
        "order_id": order_id,
        "transaction_status": "settlement",
        "status_code": "200",
        "gross_amount": "200000.00",
        "signature_key": "dummy-signature"
    }

    response = instructor_client.post(url_webhook, webhook_data, format="json")
    assert response.status_code == status.HTTP_200_OK

    instructor.refresh_from_db()
    assert instructor.ai_credits == 70  # 20 default + 50 purchased
    
    # Check transaction log
    log = AICreditTransaction.objects.filter(instructor=instructor, amount=50).first()
    assert log is not None
    assert log.reference_id == order_id

@pytest.mark.django_db
def test_verify_credit_purchase_transaction(instructor_client, instructor):
    url_checkout = reverse("payment_checkout_credits")
    resp_checkout = instructor_client.post(url_checkout, {"package": "package_100"}, format="json")
    order_id = resp_checkout.data["order_id"]

    # Initial credits should be 20
    assert instructor.ai_credits == 20

    url_verify = reverse("payment_verify")
    from unittest.mock import patch
    with patch("payments.views.check_transaction_status") as mock_check:
        mock_check.return_value = {
            "transaction_status": "settlement",
            "fraud_status": "accept",
            "status_code": "200",
            "gross_amount": "350000.00"
        }

        response = instructor_client.post(url_verify, {"order_id": order_id}, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "success"

        instructor.refresh_from_db()
        assert instructor.ai_credits == 120  # 20 default + 100 purchased

@pytest.mark.django_db
def test_instructor_credit_history_api(instructor_client, instructor):
    # Add a mock transaction log
    AICreditTransaction.objects.create(
        instructor=instructor,
        amount=-1,
        description="Usage: test generation"
    )

    url = reverse("instructor_credits")
    response = instructor_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert response.data["ai_credits"] == 20
    assert len(response.data["transactions"]) == 1
    assert response.data["transactions"][0]["amount"] == -1

@pytest.mark.django_db
def test_material_ai_generation_deducts_credits(instructor_client, instructor):
    assert instructor.ai_credits == 20

    url = reverse("material-ai-generate")
    # Mock services generate_material_draft to not actually call Gemini
    from unittest.mock import patch
    with patch("courses.services.generate_material_draft") as mock_gen:
        mock_gen.return_value = "# Generated Material Content"
        response = instructor_client.post(url, {
            "topic": "Python basics",
            "template_type": "theory",
            "subchapter_title": "Intro to Python"
        }, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["content"] == "# Generated Material Content"

        instructor.refresh_from_db()
        assert instructor.ai_credits == 19

        # Check transaction log
        log = AICreditTransaction.objects.filter(instructor=instructor, amount=-1).first()
        assert log is not None
        assert "Intro to Python" in log.description

@pytest.mark.django_db
def test_material_ai_generation_unauthorized_if_insufficient_credits(instructor_client, instructor):
    instructor.ai_credits = 0
    instructor.save()

    url = reverse("material-ai-generate")
    response = instructor_client.post(url, {
        "topic": "Python basics"
    }, format="json")

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert "Kredit AI habis" in response.data["detail"]

@pytest.mark.django_db
def test_material_ai_generation_failure_does_not_deduct_credits(instructor_client, instructor):
    assert instructor.ai_credits == 20

    url = reverse("material-ai-generate")
    from unittest.mock import patch
    with patch("courses.services.generate_material_draft", side_effect=Exception("Gemini Rate Limit Exceeded")):
        with patch.dict('os.environ', {'GEMINI_API_KEY': 'real-api-key'}):
            response = instructor_client.post(url, {
                "topic": "Python basics",
                "template_type": "theory",
                "subchapter_title": "Intro to Python"
            }, format="json")

            assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
            assert "Gemini Rate Limit Exceeded" in response.data["detail"]

            instructor.refresh_from_db()
            assert instructor.ai_credits == 20

@pytest.mark.django_db
def test_quiz_ai_generation_failure_does_not_deduct_credits(instructor_client, instructor):
    assert instructor.ai_credits == 20

    from courses.models import Course, CourseModule
    course = Course.objects.create(code="IF203", title="Test Course", sks=3, semester=3, department="Informatika")
    module = CourseModule.objects.create(course=course, title="Modul Test", description="Membahas test", order=1)

    url = reverse("quiz_generate", kwargs={"module_id": module.id})
    from unittest.mock import patch
    with patch("google.generativeai.GenerativeModel.generate_content", side_effect=Exception("Gemini 429 Quota Exceeded")):
        with patch.dict('os.environ', {'GEMINI_API_KEY': 'real-api-key'}):
            response = instructor_client.post(url, format="json")

            assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
            assert "Gemini 429 Quota Exceeded" in response.data["detail"]

            instructor.refresh_from_db()
            assert instructor.ai_credits == 20
