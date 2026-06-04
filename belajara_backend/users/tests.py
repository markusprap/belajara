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
    assert "tokens" in response.data
    assert response.data["user"]["username"] == "newstudent"
    assert response.data["user"]["mahasiswa_profile"]["nim"] == "87654321"

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
def test_google_oauth_new_user():
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

@pytest.mark.django_db
def test_google_oauth_existing_user():
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

@pytest.mark.django_db
def test_register_instructor_api():
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
    assert "tokens" in response.data
    assert response.data["user"]["username"] == "newinstructor"
    assert response.data["user"]["is_instructor"] is True
    assert response.data["user"]["instructor_profile"]["nidn"] == "9876543210"
    assert response.data["user"]["instructor_profile"]["bidang_keahlian"] == "Kecerdasan Buatan"

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
def test_google_oauth_new_instructor():
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



