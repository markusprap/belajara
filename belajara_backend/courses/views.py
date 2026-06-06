from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db.models import Q
from users.models import Mahasiswa
from .models import Course, CourseModule
from .serializers import CourseSerializer, CourseModuleSerializer
from .permissions import IsInstructor

from rest_framework.pagination import PageNumberPagination

class CoursePagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class CourseListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        queryset = Course.objects.all().prefetch_related('modules__subchapters')

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
    permission_classes = [IsAuthenticated]

    def post(self, request):
        course_code = request.data.get('course_code')
        enrollment_mode = request.data.get('enrollment_mode')
        if not course_code:
            return Response({"detail": "Kode mata kuliah (course_code) harus diberikan."}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        if not getattr(user, 'is_mahasiswa', False):
            return Response(
                {"detail": "Hanya mahasiswa yang dapat mendaftar mata kuliah."},
                status=status.HTTP_403_FORBIDDEN
            )

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
        is_user_premium = getattr(user, 'is_premium', False)
        
        # Check if there is a successful purchase for this specific course
        from payments.models import Transaction
        has_purchased = Transaction.objects.filter(
            mahasiswa=mahasiswa,
            course=course,
            status='success'
        ).exists()

        if is_course_free or is_user_premium or has_purchased:
            if enrollment_mode == 'audit' and not is_course_free:
                mode = 'audit'
            else:
                mode = 'verified'
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
    permission_classes = [AllowAny]

    def get(self, request, code):
        try:
            course = Course.objects.prefetch_related('modules__subchapters').get(code=code)
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


class MaterialAIGenerateView(APIView):
    """
    POST /api/courses/ai/generate-material/
    Body: { topic, template_type, subchapter_title, course_title }
    Returns: { content: "<markdown string>" }

    Calls Gemini AI to generate a comprehensive course material draft in Markdown.
    Falls back to rich static templates when GEMINI_API_KEY is not configured.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        topic = (request.data.get("topic") or "").strip()
        template_type = (request.data.get("template_type") or "theory").strip()
        subchapter_title = (request.data.get("subchapter_title") or "").strip()
        course_title = (request.data.get("course_title") or "").strip()

        if not topic:
            return Response(
                {"detail": "Field 'topic' wajib diisi."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        valid_types = ("theory", "code", "case_study", "evaluation")
        if template_type not in valid_types:
            template_type = "theory"

        try:
            from .services import generate_material_draft
            content = generate_material_draft(
                topic=topic,
                template_type=template_type,
                subchapter_title=subchapter_title,
                course_title=course_title,
            )
            return Response({"content": content}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"detail": f"Gagal menghasilkan materi: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
