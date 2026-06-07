import pytest
from unittest.mock import patch
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from courses.models import Course, CourseModule
from users.services.mahasiswa_service import create_mahasiswa
from quizzes.models import Quiz, QuizSubmission

@pytest.mark.django_db
@patch('quizzes.views.generate_quiz_for_module')
def test_quiz_lifecycle(mock_generate):
    course = Course.objects.create(code="IF202", title="Pemberitahuan Sistem", sks=3, semester=3, department="Informatika")
    module = CourseModule.objects.create(course=course, title="Modul Pengenalan", description="Membahas pengenalan sistem", order=1)

    questions_mock = [
        {"question": "Q1", "options": {"A": "A1", "B": "B1"}, "correct_answer": "B", "explanation": "E1"},
        {"question": "Q2", "options": {"A": "A2", "B": "B2"}, "correct_answer": "B", "explanation": "E2"},
        {"question": "Q3", "options": {"A": "A3", "B": "B3"}, "correct_answer": "B", "explanation": "E3"},
        {"question": "Q4", "options": {"A": "A4", "B": "B4"}, "correct_answer": "A", "explanation": "E4"},
        {"question": "Q5", "options": {"A": "A5", "B": "B5"}, "correct_answer": "B", "explanation": "E5"},
    ]
    mock_quiz = Quiz.objects.create(
        module=module,
        questions_json=questions_mock,
        generated_by_ai=True
    )
    mock_generate.return_value = mock_quiz

    student = create_mahasiswa(
        username="quizstudent",
        password="studentpass123",
        email="quizstudent@example.com",
        nim="55443322",
        jurusan="Informatika",
        universitas="Unair"
    )

    from django.contrib.auth import get_user_model
    User = get_user_model()
    instructor = User.objects.create_user(
        username="quizinstructor",
        password="instructorpass123",
        email="instructor@example.com",
        is_instructor=True,
        is_mahasiswa=False
    )

    client = APIClient()
    login_url = reverse('token_obtain_pair')

    # 1. Instructor generates the quiz
    response = client.post(login_url, {"username": "quizinstructor", "password": "instructorpass123"}, format='json')
    instructor_token = response.data["access"]
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {instructor_token}')

    gen_url = reverse('quiz_generate', kwargs={'module_id': module.id})
    gen_response = client.post(gen_url, format='json')
    assert gen_response.status_code == status.HTTP_201_CREATED
    assert gen_response.data["generated_by_ai"] is True
    assert "questions_json" in gen_response.data
    quiz_id = gen_response.data["id"]

    # 2. Student logs in and accesses the quiz
    response = client.post(login_url, {"username": "quizstudent", "password": "studentpass123"}, format='json')
    student_token = response.data["access"]
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {student_token}')

    # Test student cannot generate quiz
    gen_blocked = client.post(gen_url, format='json')
    assert gen_blocked.status_code == status.HTTP_403_FORBIDDEN

    # Test Get Quiz (student mode)
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


@pytest.mark.django_db
@patch('quizzes.views.generate_quiz_for_module')
def test_quiz_time_limits_and_premium_gating(mock_generate):
    free_course = Course.objects.create(code="IF203", title="Advanced Data Structures", sks=3, semester=4, department="Informatika", is_premium=False)
    premium_course = Course.objects.create(code="IF204", title="Premium Data Structures", sks=3, semester=4, department="Informatika", is_premium=True)
    free_module = CourseModule.objects.create(course=free_course, title="Introduction to Trees", description="Free intro", order=1)
    premium_module = CourseModule.objects.create(course=premium_course, title="Red-Black Trees", description="Premium chapter", order=2)

    def mock_gen_func(module_id):
        from quizzes.models import Quiz
        from courses.models import CourseModule
        m = CourseModule.objects.get(pk=module_id)
        return Quiz.objects.create(
            module=m,
            questions_json=[{"question": "Q1", "options": {"A": "A1"}, "correct_answer": "A", "explanation": "E1"}],
            generated_by_ai=True
        )
    mock_generate.side_effect = mock_gen_func

    from django.contrib.auth import get_user_model
    User = get_user_model()
    instructor = User.objects.create_user(
        username="quizinstructor2",
        password="instructorpass123",
        email="instructor2@example.com",
        is_instructor=True,
        is_mahasiswa=False
    )
    # Give premium access to instructor so they can generate premium quizzes
    instructor.is_premium = True
    instructor.save()

    free_student = create_mahasiswa(
        username="free_student",
        password="studentpass123",
        email="free@example.com",
        nim="11111111",
        jurusan="Informatika",
        universitas="UI"
    )
    premium_student = create_mahasiswa(
        username="premium_student",
        password="studentpass123",
        email="premium@example.com",
        nim="22222222",
        jurusan="Informatika",
        universitas="UI"
    )
    # Mark premium student as premium
    premium_student.user.is_premium = True
    premium_student.user.save()

    client_instructor = APIClient()
    login_url = reverse('token_obtain_pair')
    r_inst = client_instructor.post(login_url, {"username": "quizinstructor2", "password": "instructorpass123"}, format='json')
    client_instructor.credentials(HTTP_AUTHORIZATION=f'Bearer {r_inst.data["access"]}')

    client_free = APIClient()
    r = client_free.post(login_url, {"username": "free_student", "password": "studentpass123"}, format='json')
    client_free.credentials(HTTP_AUTHORIZATION=f'Bearer {r.data["access"]}')

    client_premium = APIClient()
    r_prem = client_premium.post(login_url, {"username": "premium_student", "password": "studentpass123"}, format='json')
    client_premium.credentials(HTTP_AUTHORIZATION=f'Bearer {r_prem.data["access"]}')

    # 1. Instructor generates free quiz
    gen_url_free = reverse('quiz_generate', kwargs={'module_id': free_module.id})
    res_free = client_instructor.post(gen_url_free, format='json')
    assert res_free.status_code == status.HTTP_201_CREATED
    quiz_free_id = res_free.data["id"]

    # Student cannot generate quiz
    res_free_blocked = client_free.post(gen_url_free, format='json')
    assert res_free_blocked.status_code == status.HTTP_403_FORBIDDEN

    # 2. Free student accesses free quiz (gets 600s time limit)
    detail_url_free = reverse('quiz_detail', kwargs={'quiz_id': quiz_free_id})
    res_detail_free = client_free.get(detail_url_free)
    assert res_detail_free.status_code == status.HTTP_200_OK
    assert res_detail_free.data["time_limit"] == 600

    # 3. Premium student accesses same free quiz (gets 900s time limit)
    res_detail_prem = client_premium.get(detail_url_free)
    assert res_detail_prem.status_code == status.HTTP_200_OK
    assert res_detail_prem.data["time_limit"] == 900

    # 4. Instructor generates premium quiz
    gen_url_prem = reverse('quiz_generate', kwargs={'module_id': premium_module.id})
    res_prem = client_instructor.post(gen_url_prem, format='json')
    assert res_prem.status_code == status.HTTP_201_CREATED
    quiz_prem_id = res_prem.data["id"]

    # 5. Free student is blocked from accessing the generated premium quiz
    detail_url_prem = reverse('quiz_detail', kwargs={'quiz_id': quiz_prem_id})
    res_blocked = client_free.get(detail_url_prem)
    assert res_blocked.status_code == status.HTTP_403_FORBIDDEN

    # 6. Premium student accesses premium quiz (gets 900s time limit)
    res_allowed = client_premium.get(detail_url_prem)
    assert res_allowed.status_code == status.HTTP_200_OK
    assert res_allowed.data["time_limit"] == 900

