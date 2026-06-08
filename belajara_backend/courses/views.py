from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db.models import Q, Prefetch, Count, Case, When, Value, FloatField
from django.db.models.functions import Cast
from users.models import Mahasiswa
from .models import Course, CourseModule, Enrollment, Certificate
from .serializers import CourseSerializer, CourseModuleSerializer
from .permissions import IsInstructor

def annotate_course_queryset(queryset):
    queryset = queryset.annotate(
        annotated_enrollment_count=Count('enrollments', distinct=True),
        annotated_completed_count=Count('enrollments', filter=Q(enrollments__status='completed'), distinct=True)
    )
    return queryset.annotate(
        annotated_completion_rate=Case(
            When(annotated_enrollment_count=0, then=Value(0.0)),
            default=Cast('annotated_completed_count', FloatField()) * 100.0 / Cast('annotated_enrollment_count', FloatField()),
            output_field=FloatField()
        )
    )

from rest_framework.pagination import PageNumberPagination

class CoursePagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class CourseListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        queryset = Course.objects.all()
        queryset = annotate_course_queryset(queryset)
        queryset = queryset.prefetch_related(
            Prefetch('modules', queryset=CourseModule.objects.select_related('course').prefetch_related('subchapters'))
        )

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
            queryset = Course.objects.all()
            queryset = annotate_course_queryset(queryset)
            course = queryset.prefetch_related(
                Prefetch('modules', queryset=CourseModule.objects.select_related('course').prefetch_related('subchapters'))
            ).get(code=code)
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
            # Dynamically set instructor and category details from logged-in instructor
            instructor_name = request.user.get_full_name() or request.user.username
            instructor_email = request.user.email
            category = request.data.get('category') or request.data.get('department') or 'IT & Software'
            
            serializer.save(
                instructor_name=instructor_name,
                instructor_email=instructor_email,
                category=category
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class CourseUpdateDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsInstructor]

    def put(self, request, code):
        try:
            course = Course.objects.get(code=code)
        except Course.DoesNotExist:
            return Response({'detail': 'Mata kuliah tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)

        # Check course ownership
        if course.instructor_email and course.instructor_email != request.user.email:
            return Response(
                {'detail': 'Anda tidak memiliki akses untuk mengubah mata kuliah ini.'},
                status=status.HTTP_403_FORBIDDEN
            )

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

        # Check course ownership
        if course.instructor_email and course.instructor_email != request.user.email:
            return Response(
                {'detail': 'Anda tidak memiliki akses untuk menghapus mata kuliah ini.'},
                status=status.HTTP_403_FORBIDDEN
            )

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
        from users.models import InstructorProfile, AICreditTransaction
        from django.db import transaction

        # Check AI credit if instructor
        is_instructor = getattr(request.user, 'is_instructor', False)
        instructor = None
        if is_instructor:
            instructor, created = InstructorProfile.objects.get_or_create(
                user=request.user,
                defaults={"nidn": f"MOCK-{request.user.id}", "bidang_keahlian": "Umum", "universitas": "Universitas Indonesia"}
            )
            
            if instructor.ai_credits < 1:
                return Response(
                    {"detail": "Kredit AI habis. Silakan lakukan top up."},
                    status=status.HTTP_403_FORBIDDEN
                )

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

            # Deduct credit if generation is successful and user is instructor
            if is_instructor and instructor:
                with transaction.atomic():
                    # Reload credit to avoid race conditions
                    instructor = InstructorProfile.objects.select_for_update().get(pk=instructor.pk)
                    if instructor.ai_credits < 1:
                        return Response(
                            {"detail": "Kredit AI habis. Silakan lakukan top up."},
                            status=status.HTTP_403_FORBIDDEN
                        )
                    instructor.ai_credits -= 1
                    instructor.save()
                    AICreditTransaction.objects.create(
                        instructor=instructor,
                        amount=-1,
                        description=f"Pembuatan materi AI: {subchapter_title or topic}"
                    )

            return Response({"content": content}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"detail": f"Gagal menghasilkan materi: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class CourseCertificateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, code):
        try:
            course = Course.objects.prefetch_related('modules').get(code=code)
        except Course.DoesNotExist:
            return Response({"detail": "Mata kuliah tidak ditemukan."}, status=status.HTTP_404_NOT_FOUND)

        try:
            from users.selectors import get_mahasiswa_by_user
            mahasiswa = get_mahasiswa_by_user(user=request.user)
        except Exception:
            return Response({"detail": "Hanya mahasiswa yang dapat mengakses sertifikat."}, status=status.HTTP_403_FORBIDDEN)

        try:
            enrollment = Enrollment.objects.get(mahasiswa=mahasiswa, course=course)
        except Enrollment.DoesNotExist:
            return Response({"detail": "Anda belum terdaftar di kelas ini."}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Check if already claimed
        certificate = Certificate.objects.filter(mahasiswa=mahasiswa, course=course).first()
        if certificate:
            return Response({
                "status": "claimed",
                "certificate": {
                    "certificate_id": certificate.certificate_id,
                    "issued_at": certificate.issued_at,
                    "student_name": request.user.get_full_name() or request.user.username,
                    "course_title": course.title
                }
            }, status=status.HTTP_200_OK)

        # 2. Check if in audit mode
        if enrollment.mode == 'audit' and not request.user.is_premium:
            return Response({
                "status": "locked",
                "detail": "Sertifikat hanya tersedia untuk Kelas Terverifikasi (Premium)."
            }, status=status.HTTP_200_OK)

        # 3. Calculate quiz progress eligibility
        modules = course.modules.all()
        if not modules.exists():
            return Response({
                "status": "not_eligible",
                "detail": "Kelas ini belum memiliki modul.",
                "progress": {
                    "passed_modules_count": 0,
                    "total_modules_count": 0,
                    "details": []
                }
            }, status=status.HTTP_200_OK)

        # 3b. Verify subchapter completion progress (100% required)
        from .models import SubChapter
        completed_param = request.query_params.get("completed_subchapters", "")
        completed_subchapters = [x.strip() for x in completed_param.split(",") if x.strip()] if completed_param else []

        non_forum_completed = set()
        for sub_id in completed_subchapters:
            sub_id_str = str(sub_id)
            if sub_id_str.endswith("_sub5"):
                continue
            if sub_id_str.isdigit():
                try:
                    sub_obj = SubChapter.objects.get(id=int(sub_id_str))
                    if sub_obj.type == 'forum':
                        continue
                except SubChapter.DoesNotExist:
                    pass
            non_forum_completed.add(sub_id_str)

        db_non_forum_count = SubChapter.objects.filter(
            module__course=course
        ).exclude(type='forum').count()

        if db_non_forum_count == 0:
            db_non_forum_count = modules.count() * 4

        is_progress_eligible = (len(non_forum_completed) >= db_non_forum_count)

        total_modules_count = modules.count()
        passed_modules_count = 0
        details = []

        from quizzes.models import Quiz
        for m in modules:
            quizzes = m.quizzes.all()
            if not quizzes.exists():
                # No quiz means auto-passed for this module
                passed = True
            else:
                # Must have passed at least one quiz in this module
                passed = False
                for q in quizzes:
                    if q.submissions.filter(mahasiswa=mahasiswa, passed=True).exists():
                        passed = True
                        break
            if passed:
                passed_modules_count += 1
            
            details.append({
                "module_id": m.id,
                "module_title": m.title,
                "quiz_passed": passed
            })

        is_eligible = (passed_modules_count == total_modules_count) and is_progress_eligible
        
        if not is_eligible:
            if not is_progress_eligible:
                detail = f"Selesaikan seluruh materi kuliah 100% terlebih dahulu ({len(non_forum_completed)}/{db_non_forum_count} sub-bab selesai)."
            else:
                detail = "Selesaikan seluruh kuis evaluasi dengan nilai minimal 60%."
        else:
            detail = "Anda berhak mengklaim sertifikat!"

        return Response({
            "status": "eligible" if is_eligible else "not_eligible",
            "detail": detail,
            "progress": {
                "passed_modules_count": passed_modules_count,
                "total_modules_count": total_modules_count,
                "details": details
            }
        }, status=status.HTTP_200_OK)


class CourseClaimCertificateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, code):
        try:
            course = Course.objects.prefetch_related('modules').get(code=code)
        except Course.DoesNotExist:
            return Response({"detail": "Mata kuliah tidak ditemukan."}, status=status.HTTP_404_NOT_FOUND)

        try:
            from users.selectors import get_mahasiswa_by_user
            mahasiswa = get_mahasiswa_by_user(user=request.user)
        except Exception:
            return Response({"detail": "Hanya mahasiswa yang dapat mengklaim sertifikat."}, status=status.HTTP_403_FORBIDDEN)

        try:
            enrollment = Enrollment.objects.get(mahasiswa=mahasiswa, course=course)
        except Enrollment.DoesNotExist:
            return Response({"detail": "Anda belum terdaftar di kelas ini."}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Check if already claimed
        existing = Certificate.objects.filter(mahasiswa=mahasiswa, course=course).first()
        if existing:
            return Response({
                "status": "claimed",
                "certificate": {
                    "certificate_id": existing.certificate_id,
                    "issued_at": existing.issued_at,
                    "student_name": request.user.get_full_name() or request.user.username,
                    "course_title": course.title
                }
            }, status=status.HTTP_200_OK)

        # 2. Check if in audit mode
        if enrollment.mode == 'audit' and not request.user.is_premium:
            return Response({"detail": "Sertifikat hanya tersedia untuk Kelas Terverifikasi (Premium)."}, status=status.HTTP_403_FORBIDDEN)

        # 2b. Verify subchapter completion progress (100% required)
        from .models import SubChapter
        completed_subchapters = request.data.get("completed_subchapters", [])
        if not isinstance(completed_subchapters, list):
            completed_subchapters = []

        non_forum_completed = set()
        for sub_id in completed_subchapters:
            sub_id_str = str(sub_id)
            if sub_id_str.endswith("_sub5"):
                continue
            if sub_id_str.isdigit():
                try:
                    sub_obj = SubChapter.objects.get(id=int(sub_id_str))
                    if sub_obj.type == 'forum':
                        continue
                except SubChapter.DoesNotExist:
                    pass
            non_forum_completed.add(sub_id_str)

        db_non_forum_count = SubChapter.objects.filter(
            module__course=course
        ).exclude(type='forum').count()

        if db_non_forum_count == 0:
            db_non_forum_count = course.modules.count() * 4

        if len(non_forum_completed) < db_non_forum_count:
            return Response(
                {"detail": f"Kemajuan belajar Anda belum mencapai 100% ({len(non_forum_completed)}/{db_non_forum_count} sub-bab selesai). Harap selesaikan seluruh materi terlebih dahulu."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Verify eligibility
        modules = course.modules.all()
        if not modules.exists():
            return Response({"detail": "Kelas ini belum memiliki modul."}, status=status.HTTP_400_BAD_REQUEST)

        from quizzes.models import Quiz
        for m in modules:
            quizzes = m.quizzes.all()
            if quizzes.exists():
                passed = False
                for q in quizzes:
                    if q.submissions.filter(mahasiswa=mahasiswa, passed=True).exists():
                        passed = True
                        break
                if not passed:
                    return Response({"detail": f"Anda belum menyelesaikan atau lulus evaluasi untuk {m.title}."}, status=status.HTTP_400_BAD_REQUEST)

        # 4. Generate unique ID
        import uuid
        random_hex = uuid.uuid4().hex[:6].upper()
        clean_nim = mahasiswa.nim or "STUDENT"
        cert_id = f"CERT-{course.code}-{clean_nim}-{random_hex}"

        certificate = Certificate.objects.create(
            mahasiswa=mahasiswa,
            course=course,
            certificate_id=cert_id
        )

        # Mark enrollment completed
        enrollment.status = 'completed'
        enrollment.save()

        return Response({
            "status": "claimed",
            "certificate": {
                "certificate_id": certificate.certificate_id,
                "issued_at": certificate.issued_at,
                "student_name": request.user.get_full_name() or request.user.username,
                "course_title": course.title
            }
        }, status=status.HTTP_201_CREATED)
