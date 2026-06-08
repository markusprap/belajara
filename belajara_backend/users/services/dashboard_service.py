from users.models import Mahasiswa
from courses.serializers import CourseSerializer
from explore.models import AIRecommendation

def get_student_dashboard_data(user) -> dict:
    """
    Fetches real dashboard data for a student user from PostgreSQL.
    Utilizes prefetching to ensure fast query performance.
    """
    # 1. Resolve student profile
    if not user or not user.is_authenticated:
        raise ValueError("Authentication credentials were not provided.")

    if not getattr(user, 'is_mahasiswa', False):
        raise ValueError("Profil mahasiswa tidak ditemukan.")

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
    from django.db.models import Prefetch
    from courses.models import CourseModule
    from courses.views import annotate_course_queryset
    
    active_courses_qs = mahasiswa.active_courses.all()
    active_courses_qs = annotate_course_queryset(active_courses_qs)
    active_courses_qs = active_courses_qs.prefetch_related(
        Prefetch('modules', queryset=CourseModule.objects.select_related('course').prefetch_related('subchapters'))
    )
    
    from courses.models import Enrollment
    enrollments_map = {e.course_id: e for e in Enrollment.objects.filter(mahasiswa=mahasiswa)}
    
    active_courses_data = []
    for course in active_courses_qs:
        course_data = CourseSerializer(course).data
        enrollment = enrollments_map.get(course.id)
        if enrollment:
            course_data['enrollment_mode'] = enrollment.mode
            course_data['enrolled_at'] = enrollment.enrolled_at.isoformat() if enrollment.enrolled_at else None
        else:
            mode = 'verified' if (course.price <= 0 or not course.is_premium) else 'audit'
            course_data['enrollment_mode'] = mode
            course_data['enrolled_at'] = None
        active_courses_data.append(course_data)


    # 3. Calculate stats from DB
    from quizzes.models import QuizSubmission
    from django.db.models import Avg
    active_classes_count = active_courses_qs.count()
    ai_recs_count = AIRecommendation.objects.filter(mahasiswa=mahasiswa).count()
    
    # Calculate achievement level dynamically based on active courses (e.g. level = 1 + 2 per course)
    achievement_level = 1 + (active_classes_count * 2)

    submissions = QuizSubmission.objects.filter(mahasiswa=mahasiswa)
    average_quiz_score = round(submissions.aggregate(Avg('score'))['score__avg'] or 0.0, 1)

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
            "average_quiz_score": average_quiz_score,
        },
        "today_recommendation": today_recommendation or {
            "course_code": "N/A",
            "course_title": "Belum ada kelas aktif",
            "module_title": "Mulai eksplorasi mata kuliah",
            "module_description": "Unggah silabus Anda di menu Eksplorasi untuk mendapatkan rekomendasi AI."
        },
        "active_courses": active_courses_data
    }
