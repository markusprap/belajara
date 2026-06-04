from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import get_user_model

from courses.models import Course
from courses.serializers import CourseSerializer
from users.models import Mahasiswa
from .models import Curriculum, AIRecommendation
from .services.curriculum_service import parse_curriculum_and_save
from .tasks import analyze_curriculum_task

class PDFAnalyzeView(APIView):
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = []  # Allow open access for ease of integration

    def post(self, request, *args, **kwargs):
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({"detail": "File dokumen harus diunggah."}, status=status.HTTP_400_BAD_REQUEST)

        # File size validation (limit to 10MB)
        if uploaded_file.size > 10 * 1024 * 1024:
            return Response(
                {"detail": "Ukuran file melebihi batas maksimum (10 MB)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        filename = uploaded_file.name.lower()
        if not (filename.endswith('.pdf') or filename.endswith(('.xlsx', '.xls'))):
            return Response({"detail": "File harus berupa dokumen PDF atau Excel."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 1. Fallback to default student if not authenticated
            user = request.user
            if not user or not user.is_authenticated:
                from django.conf import settings
                if not settings.DEBUG:
                    return Response(
                        {"detail": "Authentication credentials were not provided."},
                        status=status.HTTP_401_UNAUTHORIZED
                    )

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

            # Rate limit check for free users: only 1 AI recommendation per 30 days
            if not user.is_premium:
                from django.utils import timezone
                from datetime import timedelta
                limit_time = timezone.now() - timedelta(days=30)
                recent_recs = AIRecommendation.objects.filter(
                    mahasiswa=mahasiswa,
                    created_at__gte=limit_time
                ).count()
                if recent_recs >= 1:
                    return Response(
                        {"detail": "Anda telah mencapai batas rekomendasi AI gratis (1x/bulan). Silakan upgrade ke premium untuk rekomendasi tanpa batas."},
                        status=status.HTTP_403_FORBIDDEN
                    )

            # 2. Save uploaded file metadata to Curriculum model
            curriculum_obj = Curriculum.objects.create(
                user=user,
                file_name=uploaded_file.name,
                file_url=uploaded_file
            )

            # 3. Run Celery task asynchronously
            analyze_curriculum_task.delay(curriculum_obj.id, mahasiswa.id)

            # 4. Return response immediately
            return Response(
                {"status": "processing", "curriculum_id": curriculum_obj.id},
                status=status.HTTP_200_OK
            )

        except ValueError as ve:
            return Response({"detail": str(ve)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"detail": f"Gagal menganalisis dokumen: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AIRecommendationStatusView(APIView):
    permission_classes = []  # Allow open access for ease of integration

    def get(self, request, curriculum_id, *args, **kwargs):
        recommendation = AIRecommendation.objects.select_related('mahasiswa__user').filter(curriculum_id=curriculum_id).first()
        if not recommendation:
            return Response({"status": "processing"}, status=status.HTTP_200_OK)

        # Restrict access to owner in production / authenticated context
        user = request.user
        if user and user.is_authenticated:
            if recommendation.mahasiswa.user != user:
                return Response(
                    {"detail": "Anda tidak memiliki akses ke rekomendasi ini."},
                    status=status.HTTP_403_FORBIDDEN
                )
        else:
            from django.conf import settings
            if not settings.DEBUG:
                return Response(
                    {"detail": "Authentication credentials were not provided."},
                    status=status.HTTP_401_UNAUTHORIZED
                )

        recommendations_data = recommendation.recommendations_data
        
        # Check if recommendations_data is a dict (new format) or a list (old format)
        if isinstance(recommendations_data, dict):
            academic_profile = recommendations_data.get("academic_profile", {})
            course_matches = recommendations_data.get("course_matches", [])
        else:
            academic_profile = None
            course_matches = recommendations_data if isinstance(recommendations_data, list) else []

        response_data = []
        codes = [item.get("code") for item in course_matches if item.get("code")]
        courses = Course.objects.filter(code__in=codes).prefetch_related('modules__subchapters')
        course_map = {c.code: c for c in courses}

        for item in course_matches:
            code = item.get("code")
            match_pct = item.get("match_percentage", 80)
            reason = item.get("reason", "")
            
            course_obj = course_map.get(code)
            if course_obj:
                course_serialized = CourseSerializer(course_obj).data
                response_data.append({
                    "course": course_serialized,
                    "match_percentage": match_pct,
                    "reason": reason
                })
        
        return Response({
            "status": "success",
            "academic_profile": academic_profile,
            "recommendations": response_data
        }, status=status.HTTP_200_OK)


class CurriculumUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = []  # Allow open access for ease of integration

    def post(self, request, *args, **kwargs):
        uploaded_file = request.FILES.get('file')
        department = request.data.get('department', 'Informatika')

        if not uploaded_file:
            return Response({"detail": "File kurikulum harus diunggah."}, status=status.HTTP_400_BAD_REQUEST)

        # File size validation (limit to 10MB)
        if uploaded_file.size > 10 * 1024 * 1024:
            return Response(
                {"detail": "Ukuran file melebihi batas maksimum (10 MB)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            saved_courses = parse_curriculum_and_save(uploaded_file, uploaded_file.name, department)
            serializer = CourseSerializer(saved_courses, many=True)
            return Response({
                "message": f"Berhasil memuat {len(saved_courses)} mata kuliah dari kurikulum.",
                "courses": serializer.data
            }, status=status.HTTP_201_CREATED)
        except ValueError as ve:
            return Response({"detail": str(ve)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"detail": f"Gagal memproses kurikulum: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
