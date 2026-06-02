import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from courses.models import Course
from users.services.mahasiswa_service import create_mahasiswa
from discussions.models import DiscussionPost

@pytest.mark.django_db
def test_discussion_board():
    course = Course.objects.create(code="IF301", title="Rekayasa Perangkat Lunak", sks=3, semester=5, department="Informatika")

    student = create_mahasiswa(
        username="forumuser",
        password="forumuserpass",
        email="forumuser@example.com",
        nim="99887766",
        jurusan="Informatika",
        universitas="UB"
    )

    client = APIClient()
    login_url = reverse('token_obtain_pair')
    response = client.post(login_url, {"username": "forumuser", "password": "forumuserpass"}, format='json')
    access_token = response.data["access"]
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

    # 1. Create top-level post
    disc_url = reverse('course_discussions', kwargs={'course_id': course.id})
    post_data = {
        "content": "Bagaimana cara mendesain class diagram yang baik?"
    }
    post_response = client.post(disc_url, post_data, format='json')
    assert post_response.status_code == status.HTTP_201_CREATED
    assert post_response.data["content"] == "Bagaimana cara mendesain class diagram yang baik?"
    assert post_response.data["parent"] is None
    post_id = post_response.data["id"]

    # 2. Get discussions list
    list_response = client.get(disc_url)
    assert list_response.status_code == status.HTTP_200_OK
    assert len(list_response.data) == 1
    assert list_response.data[0]["id"] == post_id

    # 3. Create a reply
    reply_url = reverse('discussion_replies', kwargs={'post_id': post_id})
    reply_data = {
        "content": "Gunakan prinsip SOLID untuk class diagram yang bersih."
    }
    reply_response = client.post(reply_url, reply_data, format='json')
    assert reply_response.status_code == status.HTTP_201_CREATED
    assert reply_response.data["content"] == "Gunakan prinsip SOLID untuk class diagram yang bersih."
    assert reply_response.data["parent"] == post_id
    reply_id = reply_response.data["id"]

    # 4. Get replies list
    replies_response = client.get(reply_url)
    assert replies_response.status_code == status.HTTP_200_OK
    assert len(replies_response.data) == 1
    assert replies_response.data[0]["id"] == reply_id

    # 5. Check replies count
    list_response_updated = client.get(disc_url)
    assert list_response_updated.data[0]["replies_count"] == 1
