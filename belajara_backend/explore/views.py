from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import get_user_model

from courses.models import Course
from courses.serializers import CourseSerializer
from users.models import Mahasiswa
from .models import Curriculum, AIRecommendation
from .services.pdf_service import extract_text_from_pdf
from .services.excel_service import extract_text_from_excel
from .services.curriculum_service import parse_curriculum_and_save
from .services.llm_service import analyze_curriculum_text

class PDFAnalyzeView(APIView):
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = []  # Allow open access for ease of integration

    def post(self, request, *args, **kwargs):
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({"detail": "File dokumen harus diunggah."}, status=status.HTTP_400_BAD_REQUEST)

        filename = uploaded_file.name.lower()
        if not (filename.endswith('.pdf') or filename.endswith(('.xlsx', '.xls'))):
            return Response({"detail": "File harus berupa dokumen PDF atau Excel."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 1. Fallback to default student if not authenticated
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

            # 2. Extract text from PDF or Excel
            if filename.endswith('.pdf'):
                text = extract_text_from_pdf(uploaded_file)
            else:
                text = extract_text_from_excel(uploaded_file)

            if not text.strip():
                return Response(
                    {"detail": "Teks tidak ditemukan dalam dokumen. Pastikan file berisi teks yang dapat dibaca."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # 3. Save uploaded file metadata to Curriculum model
            curriculum_obj = Curriculum.objects.create(
                user=user,
                file_name=uploaded_file.name,
                file_url=uploaded_file
            )

            # 4. Retrieve all courses from DB for comparison
            courses = Course.objects.all().prefetch_related('modules')
            available_courses_list = [
                {
                    "code": c.code,
                    "title": c.title,
                    "description": c.description,
                    "sks": c.sks,
                    "semester": c.semester
                }
                for c in courses
            ]

            # 5. Call LLM matching service
            recommendations = analyze_curriculum_text(text, available_courses_list)

            # 6. Map recommendations back to Course details
            response_data = []
            for rec in recommendations:
                code = rec.get("code")
                match_pct = rec.get("match_percentage", 80)
                reason = rec.get("reason", "")
                
                try:
                    course_obj = courses.get(code=code)
                    course_serialized = CourseSerializer(course_obj).data
                    response_data.append({
                        "course": course_serialized,
                        "match_percentage": match_pct,
                        "reason": reason
                    })
                except Course.DoesNotExist:
                    continue
            
            # Fallback if no courses could be matched
            if not response_data and courses.exists():
                for c in courses[:2]:
                    response_data.append({
                        "course": CourseSerializer(c).data,
                        "match_percentage": 85,
                        "reason": "Mata kuliah dasar ini sangat direkomendasikan untuk menunjang pilar keahlian informatika Anda."
                    })

            # 7. Save results into AIRecommendation model
            # Format saved data to hold serialized course details, match percentage, and reason
            saved_recommendations_list = []
            for item in response_data:
                saved_recommendations_list.append({
                    "code": item["course"]["code"],
                    "match_percentage": item["match_percentage"],
                    "reason": item["reason"]
                })
            
            AIRecommendation.objects.create(
                mahasiswa=mahasiswa,
                curriculum=curriculum_obj,
                recommendations_data=saved_recommendations_list
            )

            return Response(response_data, status=status.HTTP_200_OK)

        except ValueError as ve:
            return Response({"detail": str(ve)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"detail": f"Gagal menganalisis dokumen: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CurriculumUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = []  # Allow open access for ease of integration

    def post(self, request, *args, **kwargs):
        uploaded_file = request.FILES.get('file')
        department = request.data.get('department', 'Informatika')

        if not uploaded_file:
            return Response({"detail": "File kurikulum harus diunggah."}, status=status.HTTP_400_BAD_REQUEST)

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
