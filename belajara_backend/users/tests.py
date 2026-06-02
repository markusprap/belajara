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
