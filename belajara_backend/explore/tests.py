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
@patch('explore.views.extract_text_from_pdf', return_value="Saya berminat belajar Algoritma")
def test_pdf_analyze_api(mock_extract):
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
    assert len(response.data) > 0
    assert "match_percentage" in response.data[0]

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
    db_course = Course.objects.get(code="SI102")
    assert db_course.title == "Pengantar Sistem Informasi"
    assert db_course.modules.count() == 3

@pytest.mark.django_db
def test_course_enroll_api():
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

