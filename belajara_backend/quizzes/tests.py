import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from courses.models import Course, CourseModule
from users.services.mahasiswa_service import create_mahasiswa
from quizzes.models import Quiz, QuizSubmission

@pytest.mark.django_db
def test_quiz_lifecycle():
    course = Course.objects.create(code="IF202", title="Pemberitahuan Sistem", sks=3, semester=3, department="Informatika")
    module = CourseModule.objects.create(course=course, title="Modul Pengenalan", description="Membahas pengenalan sistem", order=1)

    student = create_mahasiswa(
        username="quizstudent",
        password="studentpass123",
        email="quizstudent@example.com",
        nim="55443322",
        jurusan="Informatika",
        universitas="Unair"
    )

    client = APIClient()
    login_url = reverse('token_obtain_pair')
    response = client.post(login_url, {"username": "quizstudent", "password": "studentpass123"}, format='json')
    access_token = response.data["access"]
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

    # 1. Test Quiz Generation
    gen_url = reverse('quiz_generate', kwargs={'module_id': module.id})
    gen_response = client.post(gen_url, format='json')
    assert gen_response.status_code == status.HTTP_201_CREATED
    assert gen_response.data["generated_by_ai"] is True
    assert "questions_json" in gen_response.data
    quiz_id = gen_response.data["id"]

    # 2. Test Get Quiz (student mode)
    detail_url = reverse('quiz_detail', kwargs={'quiz_id': quiz_id})
    detail_response = client.get(detail_url)
    assert detail_response.status_code == status.HTTP_200_OK
    assert "questions" in detail_response.data
    for question in detail_response.data["questions"]:
        assert "correct_answer" not in question
        assert "explanation" not in question

    # 3. Test Quiz Submission
    submit_url = reverse('quiz_submit', kwargs={'quiz_id': quiz_id})
    submit_data = {
        "answers": {
            "0": "B",
            "1": "B",
            "2": "B",
            "3": "A",
            "4": "B"
        }
    }
    submit_response = client.post(submit_url, submit_data, format='json')
    assert submit_response.status_code == status.HTTP_200_OK
    assert submit_response.data["score"] == 100.0
    assert submit_response.data["passed"] is True
    assert submit_response.data["correct_count"] == 5

    # 4. Test Submissions History
    history_url = reverse('quiz_submissions', kwargs={'quiz_id': quiz_id})
    history_response = client.get(history_url)
    assert history_response.status_code == status.HTTP_200_OK
    assert len(history_response.data) == 1
    assert history_response.data[0]["score"] == 100.0
