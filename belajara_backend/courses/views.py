from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.contrib.auth import get_user_model
from users.models import Mahasiswa
from .models import Course, CourseModule
from .serializers import CourseSerializer, CourseModuleSerializer
from .permissions import IsInstructor

User = get_user_model()


from rest_framework.pagination import PageNumberPagination

class CoursePagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

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

        paginator = CoursePagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        if page is not None:
            serializer = CourseSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = CourseSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CourseEnrollView(APIView):
    permission_classes = []  # Allow open access for ease of local integration

    def post(self, request):
        course_code = request.data.get('course_code')
        enrollment_mode = request.data.get('enrollment_mode')
        if not course_code:
            return Response({"detail": "Kode mata kuliah (course_code) harus diberikan."}, status=status.HTTP_400_BAD_REQUEST)

        # Fallback to test user if not authenticated
        user = request.user
        if not user or not user.is_authenticated:
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

        # Determine enrollment mode
        is_course_free = (course.price <= 0 or not course.is_premium)
        if is_course_free:
            mode = 'verified'
        else:
            if enrollment_mode in ['audit', 'verified']:
                mode = enrollment_mode
            else:
                mode = 'audit'

        # Check if already enrolled in the ManyToMany relationship
        from .models import Enrollment
        is_enrolled_m2m = mahasiswa.active_courses.filter(id=course.id).exists()
        existing_enrollment = Enrollment.objects.filter(mahasiswa=mahasiswa, course=course).first()

        if is_enrolled_m2m and existing_enrollment and existing_enrollment.mode == mode:
            return Response({"detail": f"Anda sudah terdaftar di mata kuliah {course.title} dengan mode {mode}."}, status=status.HTTP_400_BAD_REQUEST)

        # Enroll student in course
        if not is_enrolled_m2m:
            mahasiswa.active_courses.add(course)

        if existing_enrollment:
            if existing_enrollment.mode == 'audit' and mode == 'verified':
                existing_enrollment.mode = 'verified'
                existing_enrollment.save()
        else:
            Enrollment.objects.create(
                mahasiswa=mahasiswa,
                course=course,
                mode=mode,
                status='active'
            )

        return Response({
            "message": f"Berhasil mendaftar di mata kuliah {course.title} ({'Kelas Lengkap' if mode == 'verified' else 'Mode Audit'}).",
            "course": CourseSerializer(course).data,
            "enrollment_mode": mode
        }, status=status.HTTP_200_OK)


class CourseDetailView(APIView):
    permission_classes = []  # Allow open access

    def get(self, request, code):
        try:
            course = Course.objects.prefetch_related('modules').get(code=code)
        except Course.DoesNotExist:
            return Response({"detail": "Mata kuliah tidak ditemukan."}, status=status.HTTP_404_NOT_FOUND)

        serializer = CourseSerializer(course)
        data = serializer.data

        # Check enrollment status
        user = request.user
        enrollment_data = None
        if user and user.is_authenticated:
            try:
                mahasiswa = Mahasiswa.objects.get(user=user)
                from .models import Enrollment
                enrollment = Enrollment.objects.filter(mahasiswa=mahasiswa, course=course).first()
                if enrollment:
                    enrollment_data = {
                        "mode": enrollment.mode,
                        "status": enrollment.status,
                        "enrolled_at": enrollment.enrolled_at.isoformat() if enrollment.enrolled_at else None
                    }
                elif mahasiswa.active_courses.filter(id=course.id).exists():
                    mode = 'verified' if (course.price <= 0 or not course.is_premium) else 'audit'
                    enrollment_data = {
                        "mode": mode,
                        "status": "active",
                        "enrolled_at": None
                    }
            except Mahasiswa.DoesNotExist:
                pass

        data['enrollment'] = enrollment_data
        return Response(data, status=status.HTTP_200_OK)



# ─── Instructor CRUD Views ────────────────────────────────────────────────────

class CourseCreateView(APIView):
    permission_classes = [IsAuthenticated, IsInstructor]

    def post(self, request):
        serializer = CourseSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CourseUpdateDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsInstructor]

    def put(self, request, code):
        try:
            course = Course.objects.get(code=code)
        except Course.DoesNotExist:
            return Response({'detail': 'Mata kuliah tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = CourseSerializer(course, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, code):
        try:
            course = Course.objects.get(code=code)
        except Course.DoesNotExist:
            return Response({'detail': 'Mata kuliah tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)
        course.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ModuleCreateView(APIView):
    permission_classes = [IsAuthenticated, IsInstructor]

    def post(self, request, code):
        try:
            course = Course.objects.get(code=code)
        except Course.DoesNotExist:
            return Response({'detail': 'Mata kuliah tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)
        data = request.data.copy()
        data['course'] = course.id
        serializer = CourseModuleSerializer(data=data)
        if serializer.is_valid():
            serializer.save(course=course)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ModuleUpdateDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsInstructor]

    def put(self, request, pk):
        try:
            module = CourseModule.objects.get(pk=pk)
        except CourseModule.DoesNotExist:
            return Response({'detail': 'Modul tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = CourseModuleSerializer(module, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            module = CourseModule.objects.get(pk=pk)
        except CourseModule.DoesNotExist:
            return Response({'detail': 'Modul tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)
        module.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SubChapterCreateView(APIView):
    permission_classes = [IsAuthenticated, IsInstructor]

    def post(self, request, module_id):
        from .models import SubChapter
        from .serializers import SubChapterSerializer

        try:
            module = CourseModule.objects.get(pk=module_id)
        except CourseModule.DoesNotExist:
            return Response({'detail': 'Modul tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = SubChapterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(module=module)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SubChapterUpdateDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsInstructor]

    def put(self, request, pk):
        from .models import SubChapter
        from .serializers import SubChapterSerializer

        try:
            subchapter = SubChapter.objects.get(pk=pk)
        except SubChapter.DoesNotExist:
            return Response({'detail': 'Sub-bab tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = SubChapterSerializer(subchapter, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        from .models import SubChapter

        try:
            subchapter = SubChapter.objects.get(pk=pk)
        except SubChapter.DoesNotExist:
            return Response({'detail': 'Sub-bab tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)
        
        subchapter.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

