"""
Integration tests for Task 05: Instructor Role Portal
Tests permission gating — only instructors can create/manage courses and modules.
"""
import pytest
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from courses.models import Course, CourseModule

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def student_user(db):
    user = User.objects.create_user(
        username='student_test',
        password='testpass123',
        email='student@test.com',
        is_mahasiswa=True,
        is_instructor=False,
    )
    return user


@pytest.fixture
def instructor_user(db):
    user = User.objects.create_user(
        username='instructor_test',
        password='testpass123',
        email='instructor@test.com',
        is_mahasiswa=False,
        is_instructor=True,
    )
    return user


@pytest.fixture
def sample_course(db):
    return Course.objects.create(
        code='IF101',
        title='Algoritma & Struktur Data',
        description='Belajar algoritma dasar',
        sks=3,
        semester=1,
        department='Informatika',
    )


def get_token(api_client, username, password):
    """Helper: login and return access token."""
    resp = api_client.post('/api/auth/login/', {
        'username': username,
        'password': password,
    }, format='json')
    assert resp.status_code == 200, f"Login failed: {resp.data}"
    return resp.data['access']


# ─── CourseCreateView Tests ──────────────────────────────────────────────────

class TestCourseCreateView:
    """POST /api/courses/create/"""

    PAYLOAD = {
        'code': 'CS999',
        'title': 'Test Kursus',
        'description': 'Deskripsi test',
        'sks': 3,
        'semester': 2,
        'department': 'Teknik Informatika',
    }

    def test_student_cannot_create_course(self, api_client, student_user):
        """Student should get 403 Forbidden."""
        token = get_token(api_client, 'student_test', 'testpass123')
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = api_client.post('/api/courses/create/', self.PAYLOAD, format='json')
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_unauthenticated_cannot_create_course(self, api_client):
        """Unauthenticated user should get 401."""
        resp = api_client.post('/api/courses/create/', self.PAYLOAD, format='json')
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_instructor_can_create_course(self, api_client, instructor_user):
        """Instructor should be able to create a course (201 Created)."""
        token = get_token(api_client, 'instructor_test', 'testpass123')
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = api_client.post('/api/courses/create/', self.PAYLOAD, format='json')
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data['code'] == 'CS999'
        assert Course.objects.filter(code='CS999').exists()

    def test_instructor_create_course_missing_fields(self, api_client, instructor_user):
        """Missing required fields should return 400."""
        token = get_token(api_client, 'instructor_test', 'testpass123')
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = api_client.post('/api/courses/create/', {'code': 'INCOMPLETE'}, format='json')
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


# ─── CourseUpdateDeleteView Tests ────────────────────────────────────────────

class TestCourseUpdateDeleteView:
    """PUT/DELETE /api/courses/<code>/manage/"""

    def test_instructor_can_update_course(self, api_client, instructor_user, sample_course):
        token = get_token(api_client, 'instructor_test', 'testpass123')
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = api_client.put(f'/api/courses/{sample_course.code}/manage/', {
            'title': 'Judul Baru',
            'description': 'Deskripsi Baru',
            'sks': 3,
            'semester': 1,
            'department': 'Informatika',
        }, format='json')
        assert resp.status_code == status.HTTP_200_OK
        sample_course.refresh_from_db()
        assert sample_course.title == 'Judul Baru'

    def test_student_cannot_update_course(self, api_client, student_user, sample_course):
        token = get_token(api_client, 'student_test', 'testpass123')
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = api_client.put(f'/api/courses/{sample_course.code}/manage/', {
            'title': 'Hacked Title',
        }, format='json')
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_instructor_can_delete_course(self, api_client, instructor_user, sample_course):
        token = get_token(api_client, 'instructor_test', 'testpass123')
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = api_client.delete(f'/api/courses/{sample_course.code}/manage/')
        assert resp.status_code == status.HTTP_204_NO_CONTENT
        assert not Course.objects.filter(code=sample_course.code).exists()

    def test_update_nonexistent_course_returns_404(self, api_client, instructor_user):
        token = get_token(api_client, 'instructor_test', 'testpass123')
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = api_client.put('/api/courses/NOTEXIST/manage/', {'title': 'X'}, format='json')
        assert resp.status_code == status.HTTP_404_NOT_FOUND


# ─── ModuleCreateView Tests ──────────────────────────────────────────────────

class TestModuleCreateView:
    """POST /api/courses/<code>/modules/create/"""

    MODULE_PAYLOAD = {
        'title': 'Modul 1: Pengenalan',
        'description': 'Deskripsi modul pertama',
        'order': 1,
    }

    def test_instructor_can_add_module(self, api_client, instructor_user, sample_course):
        token = get_token(api_client, 'instructor_test', 'testpass123')
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = api_client.post(
            f'/api/courses/{sample_course.code}/modules/create/',
            self.MODULE_PAYLOAD,
            format='json'
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data['title'] == 'Modul 1: Pengenalan'
        assert CourseModule.objects.filter(course=sample_course, title='Modul 1: Pengenalan').exists()

    def test_student_cannot_add_module(self, api_client, student_user, sample_course):
        token = get_token(api_client, 'student_test', 'testpass123')
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = api_client.post(
            f'/api/courses/{sample_course.code}/modules/create/',
            self.MODULE_PAYLOAD,
            format='json'
        )
        assert resp.status_code == status.HTTP_403_FORBIDDEN


# ─── ModuleUpdateDeleteView Tests ────────────────────────────────────────────

class TestModuleUpdateDeleteView:
    """PUT/DELETE /api/modules/<pk>/manage/"""

    def test_instructor_can_update_module(self, api_client, instructor_user, sample_course):
        module = CourseModule.objects.create(
            course=sample_course, title='Old Title', description='Old desc', order=1
        )
        token = get_token(api_client, 'instructor_test', 'testpass123')
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = api_client.put(f'/api/modules/{module.pk}/manage/', {
            'title': 'New Title', 'description': 'New desc', 'order': 2
        }, format='json')
        assert resp.status_code == status.HTTP_200_OK
        module.refresh_from_db()
        assert module.title == 'New Title'

    def test_instructor_can_delete_module(self, api_client, instructor_user, sample_course):
        module = CourseModule.objects.create(
            course=sample_course, title='To Delete', description='', order=1
        )
        token = get_token(api_client, 'instructor_test', 'testpass123')
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = api_client.delete(f'/api/modules/{module.pk}/manage/')
        assert resp.status_code == status.HTTP_204_NO_CONTENT
        assert not CourseModule.objects.filter(pk=module.pk).exists()

    def test_student_cannot_delete_module(self, api_client, student_user, sample_course):
        module = CourseModule.objects.create(
            course=sample_course, title='Protected', description='', order=1
        )
        token = get_token(api_client, 'student_test', 'testpass123')
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = api_client.delete(f'/api/modules/{module.pk}/manage/')
        assert resp.status_code == status.HTTP_403_FORBIDDEN


# ─── IsInstructor Permission Unit Test ───────────────────────────────────────

class TestIsInstructorPermission:
    """Unit test for the custom permission class."""

    def test_is_instructor_field_on_user(self, instructor_user):
        assert instructor_user.is_instructor is True

    def test_student_is_not_instructor(self, student_user):
        assert student_user.is_instructor is False

    def test_user_is_instructor_serializer(self, api_client, instructor_user):
        """Verify is_instructor is exposed in /api/auth/me/ endpoint."""
        token = get_token(api_client, 'instructor_test', 'testpass123')
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = api_client.get('/api/auth/me/')
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data['is_instructor'] is True
