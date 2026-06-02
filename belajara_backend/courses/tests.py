import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from courses.models import Course

@pytest.mark.django_db
def test_course_list_api():
    client = APIClient()
    
    # Create test courses (pytest uses an isolated test database)
    Course.objects.create(code="IF101", title="Algoritma & Struktur Data", sks=3, semester=2, department="Informatika")
    Course.objects.create(code="IF201", title="Basis Data", sks=4, semester=3, department="Informatika")
    Course.objects.create(code="SI101", title="Pengantar Sistem Informasi", sks=2, semester=1, department="Sistem Informasi")
    
    url = reverse('course-list')
    
    # 1. Test get all courses
    response = client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 3

    # 2. Test search filter
    response = client.get(url, {'search': 'Algoritma'})
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 1
    assert response.data[0]['code'] == "IF101"

    # 3. Test department filter
    response = client.get(url, {'department': 'Sistem Informasi'})
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 1
    assert response.data[0]['code'] == "SI101"

    # 4. Test SKS filter
    response = client.get(url, {'sks': '4'})
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 1
    assert response.data[0]['code'] == "IF201"
