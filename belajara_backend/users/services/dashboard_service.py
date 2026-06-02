from django.contrib.auth import get_user_model
from users.models import Mahasiswa
from courses.serializers import CourseSerializer
from explore.models import AIRecommendation

def get_student_dashboard_data(user) -> dict:
    """
    Fetches real dashboard data for a student user from PostgreSQL.
    Utilizes prefetching to ensure fast query performance.
    """
    # 1. Resolve student profile (with local fallback for ease of integration)
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

    # 2. Query active courses with prefetch_related for high performance (Service Layer standard)
    active_courses_qs = mahasiswa.active_courses.all().prefetch_related('modules')
    active_courses_data = CourseSerializer(active_courses_qs, many=True).data

    # 3. Calculate stats from DB
    active_classes_count = active_courses_qs.count()
    ai_recs_count = AIRecommendation.objects.filter(mahasiswa=mahasiswa).count()
    
    # Calculate achievement level dynamically based on active courses (e.g. level = 1 + 2 per course)
    achievement_level = 1 + (active_classes_count * 2)

    # 4. Generate today's study recommendation dynamically based on active courses
    today_recommendation = None
    if active_courses_qs.exists():
        # Recommend the first module of the first active course, or a subsequent one
        rec_course = active_courses_qs.first()
        modules = rec_course.modules.all()
        if modules.exists():
            # If student has at least one active course, recommend the first module
            rec_module = modules.first()
            today_recommendation = {
                "course_code": rec_course.code,
                "course_title": rec_course.title,
                "module_title": f"Modul {rec_module.order}: {rec_module.title}",
                "module_description": rec_module.description,
            }

    return {
        "student": {
            "name": f"{user.first_name} {user.last_name}".strip() or user.username,
            "nim": mahasiswa.nim,
            "jurusan": mahasiswa.jurusan,
            "universitas": mahasiswa.universitas,
            "semester": mahasiswa.semester,
        },
        "stats": {
            "active_classes_count": active_classes_count,
            "ai_recommendations_count": ai_recs_count,
            "achievement_level": achievement_level,
        },
        "today_recommendation": today_recommendation or {
            "course_code": "N/A",
            "course_title": "Belum ada kelas aktif",
            "module_title": "Mulai eksplorasi mata kuliah",
            "module_description": "Unggah silabus Anda di menu Eksplorasi untuk mendapatkan rekomendasi AI."
        },
        "active_courses": active_courses_data
    }
