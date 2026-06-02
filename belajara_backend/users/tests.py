import pytest
from users.services import create_mahasiswa
from users.selectors import get_mahasiswa_by_nim

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

    fetched = get_mahasiswa_by_nim(nim="12345678")
    assert fetched.id == mahasiswa.id

@pytest.mark.django_db
def test_student_dashboard_service():
    from users.services.dashboard_service import get_student_dashboard_data
    from courses.models import Course
    
    mahasiswa = create_mahasiswa(
        username="budisantoso",
        password="testpassword",
        email="budi@example.com",
        nim="11223344",
        jurusan="Informatika",
        universitas="Universitas Indonesia"
    )
    
    # Create test course and enroll Budi
    course = Course.objects.create(code="IF101", title="Algoritma", sks=3, semester=2, department="Informatika")
    mahasiswa.active_courses.add(course)
    
    # Fetch dashboard data
    data = get_student_dashboard_data(mahasiswa.user)
    
    assert data["student"]["nim"] == "11223344"
    assert data["stats"]["active_classes_count"] == 1
    assert data["stats"]["achievement_level"] == 3  # 1 + 1*2
    assert len(data["active_courses"]) == 1
    assert data["active_courses"][0]["code"] == "IF101"

