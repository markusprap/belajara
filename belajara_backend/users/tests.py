import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from users.services.mahasiswa_service import create_mahasiswa

User = get_user_model()

@pytest.mark.django_db
def test_create_mahasiswa():
    mahasiswa = create_mahasiswa(
        username="testuser",
        password="testpassword",
        email="test@example.com",
        nim="12345678",
        jurusan="Informatika",
        universitas="Universitas Terbuka"
    )
    
    assert mahasiswa.nim == "12345678"
    assert mahasiswa.user.username == "testuser"
    assert mahasiswa.user.is_mahasiswa is True

@pytest.mark.django_db
def test_register_api():
    from django.core.cache import cache
    from django.core import mail
    
    mail.outbox.clear()
    client = APIClient()
    url = reverse('auth_register')
    data = {
        "username": "newstudent",
        "password": "strongpassword123",
        "email": "newstudent@example.com",
        "nim": "87654321",
        "jurusan": "Sistem Informasi",
        "universitas": "Universitas Airlangga",
        "first_name": "Budi",
        "last_name": "Sudaryo"
    }
    response = client.post(url, data, format='json')
    assert response.status_code == status.HTTP_201_CREATED
    assert "email" in response.data
    assert response.data["email"] == "newstudent@example.com"
    
    # Check that email was sent
    assert len(mail.outbox) == 1
    assert "Verifikasi Email Akun Belajara Anda" in mail.outbox[0].subject
    
    # Check that user is created but inactive
    user = User.objects.get(email="newstudent@example.com")
    assert user.username == "newstudent"
    assert user.is_active is False
    assert user.mahasiswa_profile.nim == "87654321"
    
    # Retrieve verify code from cache
    code = cache.get(f"email_verify_code_{user.email}")
    assert code is not None
    
    # Try verifying with wrong code
    verify_url = reverse('auth_verify_email')
    verify_resp = client.post(verify_url, {"email": user.email, "code": "invalid"}, format='json')
    assert verify_resp.status_code == status.HTTP_400_BAD_REQUEST
    
    # Verify with correct code
    verify_resp = client.post(verify_url, {"email": user.email, "code": code}, format='json')
    assert verify_resp.status_code == status.HTTP_200_OK
    assert verify_resp.data["detail"] == "Email berhasil diverifikasi. Akun Anda telah aktif!"
    
    # Check that user is now active
    user.refresh_from_db()
    assert user.is_active is True

@pytest.mark.django_db
def test_login_and_me_api():
    mahasiswa = create_mahasiswa(
        username="logintest",
        password="loginpass123",
        email="logintest@example.com",
        nim="99998888",
        jurusan="Informatika",
        universitas="ITS"
    )
    
    client = APIClient()
    login_url = reverse('token_obtain_pair')
    login_data = {
        "username": "logintest",
        "password": "loginpass123"
    }
    response = client.post(login_url, login_data, format='json')
    assert response.status_code == status.HTTP_200_OK
    assert "access" in response.data
    
    access_token = response.data["access"]
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
    
    me_url = reverse('auth_me')
    me_response = client.get(me_url)
    assert me_response.status_code == status.HTTP_200_OK
    assert me_response.data["username"] == "logintest"
    assert me_response.data["mahasiswa_profile"]["nim"] == "99998888"

@pytest.mark.django_db
def test_google_oauth_new_user(settings):
    settings.DEBUG = True
    client = APIClient()
    url = reverse('auth_google')
    data = {
        "email": "newgoogle@example.com",
        "first_name": "Google",
        "last_name": "User",
        "google_id": "123456789"
    }
    response = client.post(url, data, format='json')
    assert response.status_code == status.HTTP_200_OK
    assert "tokens" in response.data
    assert response.data["user"]["email"] == "newgoogle@example.com"
    assert response.data["user"]["is_mahasiswa"] is True
    assert response.data["user"]["mahasiswa_profile"]["nim"] is not None
    assert response.data["user"]["is_onboarded"] is False

@pytest.mark.django_db
def test_google_oauth_existing_user(settings):
    settings.DEBUG = True
    mahasiswa = create_mahasiswa(
        username="existinggoogle",
        password="somepassword",
        email="existing@example.com",
        nim="77776666",
        jurusan="Informatika",
        universitas="UI"
    )
    client = APIClient()
    url = reverse('auth_google')
    data = {
        "email": "existing@example.com",
        "first_name": "Existing",
        "last_name": "Google",
        "google_id": "987654321"
    }
    response = client.post(url, data, format='json')
    assert response.status_code == status.HTTP_200_OK
    assert "tokens" in response.data
    assert response.data["user"]["username"] == "existinggoogle"
    assert response.data["user"]["mahasiswa_profile"]["nim"] == "77776666"
    assert response.data["user"]["is_onboarded"] is True

@pytest.mark.django_db
def test_register_instructor_api():
    from django.core.cache import cache
    from django.core import mail
    
    mail.outbox.clear()
    client = APIClient()
    url = reverse('auth_register')
    data = {
        "username": "newinstructor",
        "password": "strongpassword123",
        "email": "newinstructor@example.com",
        "role": "instructor",
        "nidn": "9876543210",
        "bidang_keahlian": "Kecerdasan Buatan",
        "universitas": "Universitas Indonesia",
        "first_name": "Ahmad",
        "last_name": "Yani"
    }
    response = client.post(url, data, format='json')
    assert response.status_code == status.HTTP_201_CREATED
    assert "email" in response.data
    assert response.data["email"] == "newinstructor@example.com"
    
    # Check that email was sent
    assert len(mail.outbox) == 1
    assert "Verifikasi Email Akun Belajara Anda" in mail.outbox[0].subject
    
    # Check that user is created but inactive
    user = User.objects.get(email="newinstructor@example.com")
    assert user.username == "newinstructor"
    assert user.is_active is False
    assert user.is_instructor is True
    assert user.instructor_profile.nidn == "9876543210"
    assert user.instructor_profile.bidang_keahlian == "Kecerdasan Buatan"
    
    # Retrieve verify code from cache
    code = cache.get(f"email_verify_code_{user.email}")
    assert code is not None
    
    # Verify with correct code
    verify_url = reverse('auth_verify_email')
    verify_resp = client.post(verify_url, {"email": user.email, "code": code}, format='json')
    assert verify_resp.status_code == status.HTTP_200_OK
    
    # Check that user is now active
    user.refresh_from_db()
    assert user.is_active is True

@pytest.mark.django_db
def test_register_instructor_missing_nidn():
    client = APIClient()
    url = reverse('auth_register')
    data = {
        "username": "badinstructor",
        "password": "strongpassword123",
        "email": "badinstructor@example.com",
        "role": "instructor",
        "bidang_keahlian": "Kecerdasan Buatan",
        "universitas": "Universitas Indonesia"
    }
    response = client.post(url, data, format='json')
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "nidn" in response.data

@pytest.mark.django_db
def test_register_student_missing_nim():
    client = APIClient()
    url = reverse('auth_register')
    data = {
        "username": "badstudent",
        "password": "strongpassword123",
        "email": "badstudent@example.com",
        "role": "student",
        "jurusan": "Informatika",
        "universitas": "UI"
    }
    response = client.post(url, data, format='json')
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "nim" in response.data

@pytest.mark.django_db
def test_google_oauth_new_instructor(settings):
    settings.DEBUG = True
    client = APIClient()
    url = reverse('auth_google')
    data = {
        "email": "newinstructor@example.com",
        "first_name": "Google",
        "last_name": "Instructor",
        "google_id": "1234567890",
        "role": "instructor"
    }
    response = client.post(url, data, format='json')
    assert response.status_code == status.HTTP_200_OK
    assert response.data["user"]["email"] == "newinstructor@example.com"
    assert response.data["user"]["is_instructor"] is True
    assert response.data["user"]["instructor_profile"]["nidn"] is not None
    assert response.data["user"]["is_onboarded"] is False

@pytest.mark.django_db
def test_onboarding_profile_update():
    from django.contrib.auth import get_user_model
    User = get_user_model()
    user = User.objects.create_user(
        username="onboardtest",
        email="onboard@example.com",
        password="password123",
        is_onboarded=False
    )
    
    client = APIClient()
    client.force_authenticate(user=user)
    
    url = reverse('auth_me')
    data = {
        "role": "mahasiswa",
        "nim": "2201019999",
        "jurusan": "Sistem Informasi",
        "universitas": "Universitas Indonesia",
        "semester": 2
    }
    response = client.put(url, data, format='json')
    assert response.status_code == status.HTTP_200_OK
    assert response.data["is_onboarded"] is True
    assert response.data["is_mahasiswa"] is True
    assert response.data["mahasiswa_profile"]["nim"] == "2201019999"
    assert response.data["mahasiswa_profile"]["jurusan"] == "Sistem Informasi"

@pytest.mark.django_db
def test_profile_update_api():
    # 1. Test update for student
    mahasiswa = create_mahasiswa(
        username="updatestudent",
        password="password123",
        email="updatestudent@example.com",
        nim="55554444",
        jurusan="Informatika",
        universitas="UI"
    )
    client = APIClient()
    client.force_authenticate(user=mahasiswa.user)
    
    url = reverse('auth_me')
    update_data = {
        "first_name": "UpdatedName",
        "mahasiswa_profile": {
            "jurusan": "Sistem Informasi",
            "universitas": "ITS",
            "semester": 4
        }
    }
    response = client.put(url, update_data, format='json')
    assert response.status_code == status.HTTP_200_OK
    assert response.data["first_name"] == "UpdatedName"
    assert response.data["mahasiswa_profile"]["jurusan"] == "Sistem Informasi"
    assert response.data["mahasiswa_profile"]["universitas"] == "ITS"
    assert response.data["mahasiswa_profile"]["semester"] == 4
    
    # 2. Test unique NIM validation during update
    other_mahasiswa = create_mahasiswa(
        username="otherstudent",
        password="password123",
        email="other@example.com",
        nim="11112222",
        jurusan="Informatika",
        universitas="UI"
    )
    response = client.put(url, {"mahasiswa_profile": {"nim": "11112222"}}, format='json')
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "NIM sudah terdaftar" in response.data["detail"]


@pytest.mark.django_db
def test_user_serializer_subscription_tier():
    from users.serializers import UserSerializer
    from payments.models import Subscription
    from django.utils import timezone
    from datetime import timedelta

    mahasiswa = create_mahasiswa(
        username="tierstudent",
        password="password123",
        email="tierstudent@example.com",
        nim="99887766",
        jurusan="Informatika",
        universitas="UI"
    )

    # 1. Initially Free
    serializer = UserSerializer(mahasiswa.user)
    assert serializer.data["subscription_tier"] == "free"

    # 2. Legacy / test premium user without subscription row falls back to scholar
    mahasiswa.user.is_premium = True
    mahasiswa.user.save()
    serializer = UserSerializer(mahasiswa.user)
    assert serializer.data["subscription_tier"] == "scholar"

    # 3. Premium user with active "pro" subscription
    Subscription.objects.create(
        mahasiswa=mahasiswa,
        tier="pro",
        status="active",
        current_period_start=timezone.now(),
        current_period_end=timezone.now() + timedelta(days=30)
    )
    serializer = UserSerializer(mahasiswa.user)
    assert serializer.data["subscription_tier"] == "pro"


@pytest.mark.django_db
def test_change_password_api():
    mahasiswa = create_mahasiswa(
        username="pwdstudent",
        password="oldpassword123",
        email="pwd@example.com",
        nim="99887755",
        jurusan="Informatika",
        universitas="UI"
    )
    client = APIClient()
    client.force_authenticate(user=mahasiswa.user)

    url = reverse('auth_change_password')
    
    # 1. Test missing fields
    response = client.post(url, {"old_password": "oldpassword123"}, format="json")
    assert response.status_code == status.HTTP_400_BAD_REQUEST

    # 2. Test wrong old password
    response = client.post(url, {"old_password": "wrongpassword", "new_password": "newpassword123"}, format="json")
    assert response.status_code == status.HTTP_400_BAD_REQUEST

    # 3. Test short new password
    response = client.post(url, {"old_password": "oldpassword123", "new_password": "123"}, format="json")
    assert response.status_code == status.HTTP_400_BAD_REQUEST

    # 4. Success password change
    response = client.post(url, {"old_password": "oldpassword123", "new_password": "newpassword123"}, format="json")
    assert response.status_code == status.HTTP_200_OK
    assert response.data["detail"] == "Password berhasil diubah."

    # 5. Verify database user password updated
    mahasiswa.user.refresh_from_db()
    assert mahasiswa.user.check_password("newpassword123") is True


@pytest.mark.django_db
def test_forgot_password_and_reset_password_flow(settings):
    settings.DEBUG = True
    mahasiswa = create_mahasiswa(
        username="resetstudent",
        password="oldpassword123",
        email="reset@example.com",
        nim="11223344",
        jurusan="Informatika",
        universitas="UI"
    )

    client = APIClient()

    # 1. Test forgot password missing email
    forgot_url = reverse('auth_forgot_password')
    response = client.post(forgot_url, {}, format="json")
    assert response.status_code == status.HTTP_400_BAD_REQUEST

    # 2. Test forgot password invalid email
    response = client.post(forgot_url, {"email": "notfound@example.com"}, format="json")
    assert response.status_code == status.HTTP_404_NOT_FOUND

    # 3. Test forgot password success (generates code)
    response = client.post(forgot_url, {"email": "reset@example.com"}, format="json")
    assert response.status_code == status.HTTP_200_OK
    assert "code_sandbox" in response.data
    sandbox_code = response.data["code_sandbox"]

    # 4. Test reset password missing fields
    reset_url = reverse('auth_reset_password')
    response = client.post(reset_url, {"email": "reset@example.com", "code": sandbox_code}, format="json")
    assert response.status_code == status.HTTP_400_BAD_REQUEST

    # 5. Test reset password invalid code
    response = client.post(reset_url, {
        "email": "reset@example.com",
        "code": "000000",
        "new_password": "newsecurepassword123"
    }, format="json")
    assert response.status_code == status.HTTP_400_BAD_REQUEST

    # 6. Test reset password short password
    response = client.post(reset_url, {
        "email": "reset@example.com",
        "code": sandbox_code,
        "new_password": "123"
    }, format="json")
    assert response.status_code == status.HTTP_400_BAD_REQUEST

    # 7. Test reset password success
    response = client.post(reset_url, {
        "email": "reset@example.com",
        "code": sandbox_code,
        "new_password": "newsecurepassword123"
    }, format="json")
    assert response.status_code == status.HTTP_200_OK
    assert response.data["detail"] == "Password berhasil direset. Silakan login kembali."

    # 8. Verify password updated
    mahasiswa.user.refresh_from_db()
    assert mahasiswa.user.check_password("newsecurepassword123") is True



