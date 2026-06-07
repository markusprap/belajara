import io
import pytest
from unittest.mock import MagicMock, patch
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from explore.services.pdf_service import extract_text_from_pdf
from explore.services.llm_service import analyze_curriculum_text
from courses.models import Course

def authenticate_student(client: APIClient, username: str = "student"):
    from django.contrib.auth import get_user_model
    from users.models import Mahasiswa

    User = get_user_model()
    user = User.objects.create_user(
        username=username,
        password="password123",
        is_mahasiswa=True,
    )
    Mahasiswa.objects.create(
        user=user,
        nim=f"S{abs(hash(username)) % 100000000}",
        jurusan="Informatika",
        universitas="Universitas Indonesia",
    )
    client.force_authenticate(user=user)
    return user


def authenticate_instructor(client: APIClient, username: str = "instructor"):
    from django.contrib.auth import get_user_model
    from users.models import InstructorProfile

    User = get_user_model()
    user = User.objects.create_user(
        username=username,
        password="password123",
        is_instructor=True,
    )
    InstructorProfile.objects.create(
        user=user,
        nidn=f"I{abs(hash(username)) % 100000000}",
        bidang_keahlian="Kurikulum",
        universitas="Universitas Indonesia",
    )
    client.force_authenticate(user=user)
    return user


def test_extract_text_from_pdf_mocked():
    mock_page = MagicMock()
    mock_page.extract_text.return_value = "Logika dan Algoritma Pemrograman"

    mock_reader = MagicMock()
    mock_reader.pages = [mock_page]

    with patch('explore.services.pdf_service.PdfReader', return_value=mock_reader):
        dummy_file = io.BytesIO(b"dummy_pdf_data")
        text = extract_text_from_pdf(dummy_file)
        assert text == "Logika dan Algoritma Pemrograman"

def test_llm_service_fallback():
    available_courses = [
        {"code": "IF101", "title": "Algoritma & Struktur Data", "description": "Mempelajari array", "sks": 3, "semester": 2},
        {"code": "IF201", "title": "Basis Data", "description": "Mempelajari ERD", "sks": 4, "semester": 3}
    ]
    # Without environment API key set, it should raise ValueError
    with patch.dict('os.environ', {'GEMINI_API_KEY': 'your-gemini-api-key'}):
        with pytest.raises(ValueError):
            analyze_curriculum_text("Rencana belajar pemrograman", available_courses, study_program="Farmasi")

@pytest.mark.django_db
@patch('explore.views.analyze_curriculum_task.delay')
def test_pdf_analyze_api(mock_task_delay, settings):
    settings.DEBUG = True
    client = APIClient()
    authenticate_student(client, "pdfstudent")
    # Create courses in test DB
    Course.objects.create(code="IF101", title="Algoritma & Struktur Data", sks=3, semester=2, department="Informatika")
    Course.objects.create(code="IF201", title="Basis Data", sks=4, semester=3, department="Informatika")

    url = reverse('pdf-analyze')

    # Post mock PDF file
    pdf_file = io.BytesIO(b"fake PDF bytes")
    pdf_file.name = "curriculum.pdf"

    response = client.post(url, {'file': pdf_file}, format='multipart')

    assert response.status_code == status.HTTP_200_OK, response.data
    assert response.data["status"] == "processing"
    assert "curriculum_id" in response.data

    # Assert Celery task is called asynchronously
    mock_task_delay.assert_called_once()

def test_excel_extraction_mocked():
    import openpyxl
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Matkul"
    ws.append(["Kode", "Nama", "SKS"])
    ws.append(["IF102", "Dasar Pemrograman", 3])

    excel_file = io.BytesIO()
    wb.save(excel_file)
    excel_file.seek(0)

    from explore.services.excel_service import extract_text_from_excel
    text = extract_text_from_excel(excel_file)
    assert "Matkul" in text
    assert "IF102" in text
    assert "Dasar Pemrograman" in text

@pytest.mark.django_db
@patch('explore.services.curriculum_service.extract_text_from_pdf', return_value="Some SI curriculum text")
def test_curriculum_upload_api(mock_extract):
    client = APIClient()
    authenticate_instructor(client, "curriculuminstructor")
    url = reverse('curriculum-upload')

    # Post mock PDF file to seed new courses
    pdf_file = io.BytesIO(b"fake PDF bytes")
    pdf_file.name = "curriculum_sistem_informasi.pdf"

    response = client.post(url, {'file': pdf_file, 'department': 'Sistem Informasi'}, format='multipart')

    assert response.status_code == status.HTTP_201_CREATED, response.data
    assert "message" in response.data
    assert len(response.data["courses"]) > 0

    # Check that courses actually got saved in PostgreSQL
    created_codes = [c["code"] for c in response.data["courses"]]
    assert len(created_codes) > 0
    db_course = Course.objects.filter(code__in=created_codes).first()
    assert db_course is not None
    assert db_course.modules.count() > 0

    # Verify AI credit is deducted (from 20 to 19)
    from users.models import InstructorProfile, AICreditTransaction
    instructor = InstructorProfile.objects.get(user__username="curriculuminstructor")
    assert instructor.ai_credits == 19
    assert AICreditTransaction.objects.filter(instructor=instructor, amount=-1).exists()


@pytest.mark.django_db
@patch('explore.services.curriculum_service.extract_text_from_pdf', return_value="Some SI curriculum text")
def test_curriculum_upload_api_insufficient_credits(mock_extract):
    client = APIClient()
    authenticate_instructor(client, "curriculuminstructor_zero")
    
    # Set credits to 0
    from users.models import InstructorProfile
    instructor = InstructorProfile.objects.get(user__username="curriculuminstructor_zero")
    instructor.ai_credits = 0
    instructor.save()

    url = reverse('curriculum-upload')
    pdf_file = io.BytesIO(b"fake PDF bytes")
    pdf_file.name = "curriculum_sistem_informasi.pdf"

    response = client.post(url, {'file': pdf_file, 'department': 'Sistem Informasi'}, format='multipart')
    
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert "Kredit AI habis" in response.data["detail"]


@pytest.mark.django_db
@patch('explore.services.curriculum_service.extract_text_from_pdf', return_value="Some SI curriculum text")
@patch('explore.services.curriculum_service.call_gemini_to_extract_courses', side_effect=ValueError("Gemini quota exceeded"))
def test_curriculum_upload_api_failed_does_not_deduct_credits(mock_gemini, mock_extract):
    client = APIClient()
    authenticate_instructor(client, "curriculuminstructor_fail")
    
    url = reverse('curriculum-upload')
    pdf_file = io.BytesIO(b"fake PDF bytes")
    pdf_file.name = "curriculum_sistem_informasi.pdf"

    response = client.post(url, {'file': pdf_file, 'department': 'Sistem Informasi'}, format='multipart')
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Gemini quota exceeded" in response.data["detail"]

    # Verify credit is NOT deducted (remains 20)
    from users.models import InstructorProfile, AICreditTransaction
    instructor = InstructorProfile.objects.get(user__username="curriculuminstructor_fail")
    assert instructor.ai_credits == 20
    assert AICreditTransaction.objects.filter(instructor=instructor).count() == 0

@pytest.mark.django_db
def test_course_enroll_api(settings):
    settings.DEBUG = True
    client = APIClient()
    authenticate_student(client, "enrollstudent")
    # Ensure test user 'mahasiswa' and course are created in DB
    Course.objects.create(code="IF101", title="Algoritma & Struktur Data", sks=3, semester=2, department="Informatika")

    url = reverse('course-enroll')
    response = client.post(url, {'course_code': 'IF101'}, format='json')

    assert response.status_code == status.HTTP_200_OK, response.data
    assert "Berhasil mendaftar" in response.data["message"]

    # Test double enrollment warning
    response_double = client.post(url, {'course_code': 'IF101'}, format='json')
    assert response_double.status_code == status.HTTP_400_BAD_REQUEST


# --- Asynchronous Recommendations and Status Tests ---

@pytest.mark.django_db
def test_ai_recommendation_status_processing():
    client = APIClient()
    authenticate_student(client, "statusstudent")
    url = reverse('ai-recommendation-status', kwargs={'curriculum_id': 9999})
    response = client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert response.data == {"status": "processing"}

@pytest.mark.django_db
def test_ai_recommendation_status_success():
    client = APIClient()
    from users.models import Mahasiswa
    from django.contrib.auth import get_user_model
    from explore.models import Curriculum, AIRecommendation

    User = get_user_model()
    user = User.objects.create_user(username="testuser", password="password123")
    mahasiswa = Mahasiswa.objects.create(user=user, nim="12345", jurusan="Informatika")
    curriculum = Curriculum.objects.create(user=user, file_name="curriculum.pdf")

    course = Course.objects.create(code="IF101", title="Algoritma & Struktur Data", sks=3, semester=2, department="Informatika")

    # Create the recommendation in DB
    AIRecommendation.objects.create(
        mahasiswa=mahasiswa,
        curriculum=curriculum,
        recommendations_data={
            "academic_profile": {
                "completed_subjects": ["Pemrograman Dasar"],
                "competency_gaps": ["Struktur Data"],
                "career_recommendations": "Software Engineer"
            },
            "course_matches": [
                {"code": "IF101", "match_percentage": 90, "reason": "Cocok dengan minat pemrograman"}
            ]
        }
    )

    url = reverse('ai-recommendation-status', kwargs={'curriculum_id': curriculum.id})
    client.force_authenticate(user=user)
    response = client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert response.data["status"] == "success"
    assert response.data["academic_profile"]["career_recommendations"][0]["title"] == "Software Engineer"
    assert "readiness_score" in response.data["academic_profile"]
    assert len(response.data["recommendations"]) == 1
    assert response.data["recommendations"][0]["course"]["code"] == "IF101"
    assert response.data["recommendations"][0]["match_percentage"] == 90
    assert response.data["recommendations"][0]["reason"] == "Cocok dengan minat pemrograman"

@pytest.mark.django_db
def test_ai_recommendation_status_error():
    client = APIClient()
    from users.models import Mahasiswa
    from django.contrib.auth import get_user_model
    from explore.models import Curriculum, AIRecommendation

    User = get_user_model()
    user = User.objects.create_user(username="testuser_err", password="password123")
    mahasiswa = Mahasiswa.objects.create(user=user, nim="123456", jurusan="Informatika")
    curriculum = Curriculum.objects.create(user=user, file_name="curriculum.pdf")

    # Create the recommendation in DB with error state
    AIRecommendation.objects.create(
        mahasiswa=mahasiswa,
        curriculum=curriculum,
        recommendations_data={
            "status": "error",
            "error_message": "ResourceExhausted: 429 Quota exceeded"
        }
    )

    url = reverse('ai-recommendation-status', kwargs={'curriculum_id': curriculum.id})
    client.force_authenticate(user=user)
    response = client.get(url)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data["status"] == "error"
    assert response.data["detail"] == "ResourceExhausted: 429 Quota exceeded"

@pytest.mark.django_db
@patch('explore.tasks.analyze_curriculum_text')
def test_analyze_curriculum_task(mock_analyze):
    from django.core.files.uploadedfile import SimpleUploadedFile
    from users.models import Mahasiswa
    from django.contrib.auth import get_user_model
    from explore.models import Curriculum, AIRecommendation
    from explore.tasks import analyze_curriculum_task

    # Mock LLM return value — new rich output format
    mock_analyze.return_value = {
        "academic_profile": {
            "study_program": "Informatika",
            "detected_semester": 4,
            "readiness_score": 72,
            "confidence_score": 80,
            "summary": "Mahasiswa informatika dengan dasar pemrograman yang solid.",
            "next_best_action": "Ambil mata kuliah Struktur Data untuk menutup gap prioritas utama.",
            "completed_subjects": ["Matematika", "Pemrograman Dasar"],
            "competency_scores": {"software_engineering": 65, "data_ai": 50, "system_architecture": 40, "math_logic": 72, "digital_business": 55},
            "competency_axis_labels": {"software_engineering": "Software Eng.", "data_ai": "Data Sci. & AI", "system_architecture": "System Arch.", "math_logic": "Math & Logic", "digital_business": "Digital Business"},
            "competency_evidence": [
                {"competency": "Math & Logic", "competency_key": "math_logic", "course_name": "Matematika", "text_excerpt": "Terdeteksi mata kuliah Matematika dengan nilai baik.", "confidence": 85}
            ],
            "gap_map": {
                "mandatory": [{"gap": "Struktur Data", "priority": "high", "reason": "Fundamental untuk Informatika", "suggested_action": "Ambil kelas Algoritma & Struktur Data"}],
                "elective": [{"gap": "Machine Learning", "priority": "medium", "reason": "Relevan untuk karier data", "suggested_action": "Ambil kelas Data Science"}],
                "career": [{"gap": "Cloud Computing", "target_career": "Backend Engineer", "reason": "Diperlukan untuk backend modern"}]
            },
            "career_recommendations": "Data Scientist"
        },
        "course_matches": [
            {"code": "IF101", "match_percentage": 95, "reason": "Sangat sesuai dengan dasar pemrograman"}
        ]
    }

    User = get_user_model()
    user = User.objects.create_user(username="testuser2", password="password123")
    mahasiswa = Mahasiswa.objects.create(user=user, nim="67890", jurusan="Informatika")

    uploaded_file = SimpleUploadedFile("curriculum.pdf", b"fake PDF bytes")
    curriculum = Curriculum.objects.create(
        user=user,
        file_name="curriculum.pdf",
        file_url=uploaded_file
    )

    # We mock extract_text_from_pdf as we are using a fake PDF bytes
    with patch('explore.tasks.extract_text_from_pdf', return_value="Saya berminat belajar pemrograman"):
        Course.objects.create(code="IF101", title="Algoritma & Struktur Data", sks=3, semester=2, department="Informatika")

        # Execute Celery task synchronously
        analyze_curriculum_task(curriculum.id, mahasiswa.id)

        # Verify AIRecommendation is created in database with new schema
        recs = AIRecommendation.objects.filter(curriculum=curriculum)
        assert recs.exists()
        rec = recs.first()
        assert isinstance(rec.recommendations_data, dict)
        profile = rec.recommendations_data["academic_profile"]
        assert profile["career_recommendations"][0]["title"] == "Data Scientist"
        assert "readiness_score" in profile
        assert "competency_scores" in profile
        assert "gap_map" in profile
        gap_map = profile["gap_map"]
        assert "mandatory" in gap_map
        assert "elective" in gap_map
        assert "career" in gap_map
        assert "next_best_action" in profile
        assert "competency_axis_labels" in profile
        # For non-premium user, premium gating should limit courses
        assert len(rec.recommendations_data["course_matches"]) == 1
        assert rec.recommendations_data["course_matches"][0]["code"] == "IF101"

@pytest.mark.django_db
def test_cleanup_old_curriculums():
    from django.core.files.uploadedfile import SimpleUploadedFile
    from django.contrib.auth import get_user_model
    from django.utils import timezone
    from datetime import timedelta
    from explore.models import Curriculum
    from explore.tasks import cleanup_old_curriculums

    User = get_user_model()
    user = User.objects.create_user(username="cleanupuser", password="password123")

    old_time = timezone.now() - timedelta(days=8)
    new_time = timezone.now() - timedelta(days=2)

    uploaded_file_old = SimpleUploadedFile("old_cur.pdf", b"old content")
    cur_old = Curriculum.objects.create(
        user=user,
        file_name="old_cur.pdf",
        file_url=uploaded_file_old
    )
    Curriculum.objects.filter(id=cur_old.id).update(uploaded_at=old_time)

    uploaded_file_new = SimpleUploadedFile("new_cur.pdf", b"new content")
    cur_new = Curriculum.objects.create(
        user=user,
        file_name="new_cur.pdf",
        file_url=uploaded_file_new
    )
    Curriculum.objects.filter(id=cur_new.id).update(uploaded_at=new_time)

    # Reload to ensure the updated field takes effect
    cur_old.refresh_from_db()
    cur_new.refresh_from_db()

    assert cur_old.file_url.storage.exists(cur_old.file_url.name)
    assert cur_new.file_url.storage.exists(cur_new.file_url.name)

    cleanup_old_curriculums()

    assert not Curriculum.objects.filter(id=cur_old.id).exists()
    assert Curriculum.objects.filter(id=cur_new.id).exists()

    assert not cur_old.file_url.storage.exists(cur_old.file_url.name)
    assert cur_new.file_url.storage.exists(cur_new.file_url.name)

    # Cleanup test files from storage
    if cur_new.file_url:
        cur_new.file_url.delete(save=False)


@pytest.mark.django_db
@patch('explore.views.analyze_curriculum_task.delay')
def test_pdf_analyze_api_rate_limiting_free_user(mock_task_delay):
    client = APIClient()
    from users.models import Mahasiswa
    from django.contrib.auth import get_user_model
    from explore.models import Curriculum, AIRecommendation

    User = get_user_model()
    user = User.objects.create_user(username="freeuser", password="password123", is_premium=False, is_mahasiswa=True)
    mahasiswa = Mahasiswa.objects.create(user=user, nim="2201010099", jurusan="Informatika")

    # 1. First upload (no recommendations exist yet)
    url = reverse('pdf-analyze')
    client.force_authenticate(user=user)

    pdf_file = io.BytesIO(b"fake PDF bytes")
    pdf_file.name = "curriculum1.pdf"

    response = client.post(url, {'file': pdf_file}, format='multipart')
    assert response.status_code == status.HTTP_200_OK
    cur_id = response.data["curriculum_id"]

    # Simulate recommendation generation
    curriculum = Curriculum.objects.get(id=cur_id)
    AIRecommendation.objects.create(
        mahasiswa=mahasiswa,
        curriculum=curriculum,
        recommendations_data=[]
    )

    # 2. Second upload (should be blocked by rate limit)
    pdf_file2 = io.BytesIO(b"fake PDF bytes 2")
    pdf_file2.name = "curriculum2.pdf"

    response_blocked = client.post(url, {'file': pdf_file2}, format='multipart')
    assert response_blocked.status_code == status.HTTP_403_FORBIDDEN
    assert "batas rekomendasi AI gratis" in response_blocked.data["detail"]


@pytest.mark.django_db
@patch('explore.views.analyze_curriculum_task.delay')
def test_pdf_analyze_api_no_rate_limiting_premium_user(mock_task_delay):
    client = APIClient()
    from users.models import Mahasiswa
    from django.contrib.auth import get_user_model
    from explore.models import Curriculum, AIRecommendation

    User = get_user_model()
    user = User.objects.create_user(username="premiumuser", password="password123", is_premium=True, is_mahasiswa=True)
    mahasiswa = Mahasiswa.objects.create(user=user, nim="2201010098", jurusan="Informatika")

    url = reverse('pdf-analyze')
    client.force_authenticate(user=user)

    # Create an existing recommendation
    curriculum = Curriculum.objects.create(user=user, file_name="curriculum1.pdf")
    AIRecommendation.objects.create(
        mahasiswa=mahasiswa,
        curriculum=curriculum,
        recommendations_data=[]
    )

    # Premium user should bypass rate limit
    pdf_file2 = io.BytesIO(b"fake PDF bytes 2")
    pdf_file2.name = "curriculum2.pdf"

    response = client.post(url, {'file': pdf_file2}, format='multipart')
    assert response.status_code == status.HTTP_200_OK


# --- Hardening Security Tests ---

@pytest.mark.django_db
def test_unauthenticated_explore_api_rejected_in_production(settings):
    """Unauthenticated requests to pdf-analyze should return 401 in production (DEBUG=False)."""
    settings.DEBUG = False
    client = APIClient()
    url = reverse('pdf-analyze')
    pdf_file = io.BytesIO(b"fake PDF bytes")
    pdf_file.name = "curriculum.pdf"

    response = client.post(url, {'file': pdf_file}, format='multipart')
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Authentication credentials" in response.data["detail"]


@pytest.mark.django_db
def test_pdf_analyze_large_file_rejected():
    """Uploading a curriculum file larger than 10MB should return 400."""
    client = APIClient()
    authenticate_student(client, "largefilestudent")
    url = reverse('pdf-analyze')

    # 11MB file
    large_file = io.BytesIO(b"x" * (11 * 1024 * 1024))
    large_file.name = "large_curriculum.pdf"

    response = client.post(url, {'file': large_file}, format='multipart')
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "melebihi batas maksimum" in response.data["detail"]


@pytest.mark.django_db
def test_ai_recommendation_status_ownership_protection():
    """An authenticated user cannot read AI recommendations created for another user."""
    client = APIClient()
    from users.models import Mahasiswa
    from django.contrib.auth import get_user_model
    from explore.models import Curriculum, AIRecommendation

    User = get_user_model()

    # User A (Owner)
    user_a = User.objects.create_user(username="usera", password="password123")
    mahasiswa_a = Mahasiswa.objects.create(user=user_a, nim="11111", jurusan="Informatika")
    curriculum_a = Curriculum.objects.create(user=user_a, file_name="curriculum_a.pdf")

    AIRecommendation.objects.create(
        mahasiswa=mahasiswa_a,
        curriculum=curriculum_a,
        recommendations_data=[]
    )

    # User B (Attacker)
    user_b = User.objects.create_user(username="userb", password="password123")

    url = reverse('ai-recommendation-status', kwargs={'curriculum_id': curriculum_a.id})

    # Authenticate as User B and request User A's status
    client.force_authenticate(user=user_b)
    response = client.get(url)
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert "tidak memiliki akses" in response.data["detail"]


@pytest.mark.django_db
def test_premium_course_enrollment_gating(settings):
    settings.DEBUG = True
    client = APIClient()
    from django.contrib.auth import get_user_model
    from users.models import Mahasiswa

    User = get_user_model()
    # Create free user
    free_user = User.objects.create_user(username='free_student', password='testpassword123', is_mahasiswa=True, is_premium=False)
    # Create premium/subscribed user
    premium_user = User.objects.create_user(username='premium_student', password='testpassword123', is_mahasiswa=True, is_premium=True)

    # Ensure they have mahasiswa profiles
    Mahasiswa.objects.get_or_create(user=free_user, nim='123', jurusan='IF')
    Mahasiswa.objects.get_or_create(user=premium_user, nim='456', jurusan='IF')

    # Create premium course
    premium_course = Course.objects.create(
        code="IF302",
        title="Pemrograman Web",
        sks=3,
        semester=4,
        department="Informatika",
        price=150000.00,
        is_premium=True
    )

    url = reverse('course-enroll')

    # 1. Free user tries to enroll in 'verified' mode -> should get 'audit' mode instead
    client.force_authenticate(user=free_user)
    resp1 = client.post(url, {'course_code': 'IF302', 'enrollment_mode': 'verified'}, format='json')
    assert resp1.status_code == status.HTTP_200_OK
    assert resp1.data['enrollment_mode'] == 'audit'

    # 2. Premium user tries to enroll in 'verified' mode -> should get 'verified' mode successfully
    client.force_authenticate(user=premium_user)
    resp2 = client.post(url, {'course_code': 'IF302', 'enrollment_mode': 'verified'}, format='json')
    assert resp2.status_code == status.HTTP_200_OK
    assert resp2.data['enrollment_mode'] == 'verified'


@pytest.mark.django_db
def test_dynamic_study_program_detection_accounting():
    from explore.services.llm_service import normalize_academic_profile
    # Test that when study_program is detected as Akuntansi, the competency keys and labels map to Akuntansi
    raw_profile = {
        "study_program": "Akuntansi",
        "competency_scores": {},  # Trigger fallback resolution
        "competency_axis_labels": {},
    }
    normalized = normalize_academic_profile(raw_profile, "General")
    assert normalized["study_program"] == "Akuntansi"
    assert "financial_accounting" in normalized["competency_scores"]
    assert "auditing" in normalized["competency_scores"]
    assert normalized["competency_axis_labels"]["financial_accounting"] == "Akuntansi Keuangan"


@pytest.mark.django_db
def test_dynamic_study_program_detection_si():
    from explore.services.llm_service import normalize_academic_profile
    # Test that when study_program is detected as Sistem Informasi, the competency keys and labels map to Sistem Informasi
    raw_profile = {
        "study_program": "Sistem Informasi",
        "competency_scores": {},  # Trigger fallback resolution
        "competency_axis_labels": {},
    }
    normalized = normalize_academic_profile(raw_profile, "General")
    assert normalized["study_program"] == "Sistem Informasi"
    assert "data_analytics" in normalized["competency_scores"]
    assert "enterprise_architecture" in normalized["competency_scores"]
    assert normalized["competency_axis_labels"]["data_analytics"] == "Data & Analitik Bisnis"


@pytest.mark.django_db
def test_strict_subject_extraction_no_hallucination():
    from explore.tasks import analyze_curriculum_task
    from django.core.files.uploadedfile import SimpleUploadedFile
    from users.models import Mahasiswa
    from django.contrib.auth import get_user_model
    from explore.models import Curriculum, AIRecommendation

    # Mock analyze_curriculum_text to return some completed subjects, including a hallucinated one
    mock_llm_result = {
        "academic_profile": {
            "study_program": "Informatika",
            "detected_semester": 4,
            "readiness_score": 72,
            "confidence_score": 80,
            "summary": "Solid",
            "next_best_action": "Study hard",
            "completed_subjects": ["Algoritma dan Struktur Data", "Basis Data", "Hallucinated Course X"],
            "competency_scores": {},
            "competency_axis_labels": {},
            "competency_evidence": [],
            "gap_map": {"mandatory": [], "elective": [], "career": []},
            "career_recommendations": []
        },
        "course_matches": []
    }

    User = get_user_model()
    user = User.objects.create_user(username="testuser_strict", password="password123")
    mahasiswa = Mahasiswa.objects.create(user=user, nim="strict123", jurusan="Informatika")
    uploaded_file = SimpleUploadedFile("transcript.pdf", b"fake PDF bytes")
    curriculum = Curriculum.objects.create(user=user, file_name="transcript.pdf", file_url=uploaded_file)

    # Raw text only contains "Algoritma dan Struktur Data" and "Basis Data", but not "Hallucinated Course X"
    raw_text = "Transkrip Nilai: Algoritma dan Struktur Data (A), Basis Data (B+)"

    with patch('explore.tasks.extract_text_from_pdf', return_value=raw_text):
        with patch('explore.tasks.analyze_curriculum_text', return_value=mock_llm_result):
            analyze_curriculum_task(curriculum.id, mahasiswa.id)
            
            recs = AIRecommendation.objects.filter(curriculum=curriculum)
            assert recs.exists()
            rec = recs.first()
            completed = rec.recommendations_data["academic_profile"]["completed_subjects"]
            # Hallucinated Course X must be discarded because it is not in raw_text
            assert "Algoritma dan Struktur Data" in completed
            assert "Basis Data" in completed
            assert "Hallucinated Course X" not in completed


@pytest.mark.django_db
def test_instructor_credit_protection_on_api_failure():
    from explore.services.curriculum_service import parse_curriculum_and_save
    from users.models import InstructorProfile, AICreditTransaction
    from django.contrib.auth import get_user_model
    from django.core.files.uploadedfile import SimpleUploadedFile

    User = get_user_model()
    user = User.objects.create_user(username="instructor_protect", password="password123", is_instructor=True)
    instructor = InstructorProfile.objects.create(user=user, nidn="inst123", ai_credits=20)

    uploaded_file = SimpleUploadedFile("curriculum.pdf", b"fake PDF bytes")

    # Mock call_gemini_to_extract_courses to raise an Exception (API failure)
    with patch('explore.services.curriculum_service.extract_text_from_pdf', return_value="Kurikulum"):
        with patch('explore.services.curriculum_service.call_gemini_to_extract_courses', side_effect=ValueError("Gemini API Error")):
            
            # The view uses parse_curriculum_and_save, let's verify that a failed parsing raises ValueError
            with pytest.raises(ValueError):
                parse_curriculum_and_save(uploaded_file, "curriculum.pdf", "Informatika")

            # Check that instructor credit is not deducted (still 20) and no transaction is created
            instructor.refresh_from_db()
            assert instructor.ai_credits == 20
            assert AICreditTransaction.objects.filter(instructor=instructor).count() == 0
