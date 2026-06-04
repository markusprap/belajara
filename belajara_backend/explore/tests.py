import io
import pytest
from unittest.mock import MagicMock, patch
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from explore.services.pdf_service import extract_text_from_pdf
from explore.services.llm_service import analyze_curriculum_text
from courses.models import Course

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
    # Without environment API key set, it should fallback to mock recommendations
    with patch.dict('os.environ', {'GEMINI_API_KEY': 'your-gemini-api-key'}):
        recs = analyze_curriculum_text("Rencana belajar pemrograman", available_courses)
        assert len(recs) >= 2
        assert recs[0]["code"] == "IF101"

@pytest.mark.django_db
@patch('explore.views.analyze_curriculum_task.delay')
def test_pdf_analyze_api(mock_task_delay, settings):
    settings.DEBUG = True
    client = APIClient()
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

@pytest.mark.django_db
def test_course_enroll_api(settings):
    settings.DEBUG = True
    client = APIClient()
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
        recommendations_data=[
            {"code": "IF101", "match_percentage": 90, "reason": "Cocok dengan minat pemrograman"}
        ]
    )
    
    url = reverse('ai-recommendation-status', kwargs={'curriculum_id': curriculum.id})
    client.force_authenticate(user=user)
    response = client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert response.data["status"] == "success"
    assert len(response.data["recommendations"]) == 1
    assert response.data["recommendations"][0]["course"]["code"] == "IF101"
    assert response.data["recommendations"][0]["match_percentage"] == 90
    assert response.data["recommendations"][0]["reason"] == "Cocok dengan minat pemrograman"

@pytest.mark.django_db
@patch('explore.tasks.analyze_curriculum_text')
def test_analyze_curriculum_task(mock_analyze):
    from django.core.files.uploadedfile import SimpleUploadedFile
    from users.models import Mahasiswa
    from django.contrib.auth import get_user_model
    from explore.models import Curriculum, AIRecommendation
    from explore.tasks import analyze_curriculum_task
    
    # Mock LLM return value
    mock_analyze.return_value = [
        {"code": "IF101", "match_percentage": 95, "reason": "Sangat sesuai dengan dasar pemrograman"}
    ]
    
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
        
        # Verify AIRecommendation is created in database
        recs = AIRecommendation.objects.filter(curriculum=curriculum)
        assert recs.exists()
        rec = recs.first()
        assert len(rec.recommendations_data) == 1
        assert rec.recommendations_data[0]["code"] == "IF101"

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
    user = User.objects.create_user(username="freeuser", password="password123", is_premium=False)
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
    user = User.objects.create_user(username="premiumuser", password="password123", is_premium=True)
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

