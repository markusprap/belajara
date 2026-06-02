from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from django.contrib.auth import get_user_model
from users.models import Mahasiswa
from .models import Course
from .serializers import CourseSerializer

class CourseListView(APIView):
    permission_classes = []  # Allow open access for ease of local integration

    def get(self, request):
        queryset = Course.objects.all().prefetch_related('modules')
        
        # Search query
        search_query = request.query_params.get('search', '')
        if search_query:
            queryset = queryset.filter(
                Q(title__icontains=search_query) |
                Q(code__icontains=search_query) |
                Q(description__icontains=search_query)
            )

        # Department filter
        department = request.query_params.get('department', '')
        if department:
            queryset = queryset.filter(department__iexact=department)

        # SKS filter
        sks = request.query_params.get('sks', '')
        if sks:
            try:
                queryset = queryset.filter(sks=int(sks))
            except ValueError:
                pass

        # Semester filter
        semester = request.query_params.get('semester', '')
        if semester:
            try:
                queryset = queryset.filter(semester=int(semester))
            except ValueError:
                pass

        serializer = CourseSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class CourseEnrollView(APIView):
    permission_classes = []  # Allow open access for ease of local integration

    def post(self, request):
        course_code = request.data.get('course_code')
        if not course_code:
            return Response({"detail": "Kode mata kuliah (course_code) harus diberikan."}, status=status.HTTP_400_BAD_REQUEST)

        # Fallback to test user if not authenticated
        user = request.user
        if not user or not user.is_authenticated:
            User = get_user_model()
            user, created = User.objects.get_or_create(
                username="mahasiswa",
                defaults={
                    "email": "mahasiswa@belajara.id",
                    "first_name": "Budi",
                    "last_name": "Santoso",
                    "is_mahasiswa": True
                }
            )
            if created:
                user.set_password("password123")
                user.save()

        mahasiswa, m_created = Mahasiswa.objects.get_or_create(
            user=user,
            defaults={
                "nim": "2201010101",
                "jurusan": "Informatika",
                "universitas": "Universitas Indonesia",
                "semester": 3
            }
        )

        try:
            course = Course.objects.get(code=course_code)
        except Course.DoesNotExist:
            return Response({"detail": f"Mata kuliah dengan kode {course_code} tidak ditemukan."}, status=status.HTTP_404_NOT_FOUND)

        # Check if already enrolled
        if mahasiswa.active_courses.filter(id=course.id).exists():
            return Response({"detail": f"Anda sudah terdaftar di mata kuliah {course.title}."}, status=status.HTTP_400_BAD_REQUEST)

        # Enroll student in course
        mahasiswa.active_courses.add(course)
        return Response({
            "message": f"Berhasil mendaftar di mata kuliah {course.title}.",
            "course": CourseSerializer(course).data
        }, status=status.HTTP_200_OK)
