import logging
from celery import shared_task
from django.contrib.auth import get_user_model

from courses.models import Course
from users.models import Mahasiswa
from .models import Curriculum, AIRecommendation
from .services.pdf_service import extract_text_from_pdf
from .services.excel_service import extract_text_from_excel
from .services.llm_service import analyze_curriculum_text, normalize_recommendations_payload

logger = logging.getLogger(__name__)


def apply_premium_gating(academic_profile: dict, course_matches: list, is_premium: bool) -> tuple[dict, list]:
    """
    Applies premium gating to the AI analysis output.

    Free users receive:
    - Max 3 course recommendations
    - Max 2 competency evidence items (teaser only)
    - Only mandatory gaps (no elective/career gaps)
    - No semester plan
    - is_premium_analysis flag set to False

    Premium users receive full analysis.
    """
    if is_premium:
        academic_profile["is_premium_analysis"] = True
        return academic_profile, course_matches

    # Limit course recommendations to 3
    limited_courses = course_matches[:3]

    # Limit evidence to 2 items
    evidence = academic_profile.get("competency_evidence", [])
    academic_profile["competency_evidence"] = evidence[:2]

    # Limit gap_map to mandatory only (max 3 items)
    gap_map = academic_profile.get("gap_map", {})
    academic_profile["gap_map"] = {
        "mandatory": gap_map.get("mandatory", [])[:3],
        "elective": [],   # Hidden for free
        "career": [],     # Hidden for free
    }

    # Also limit legacy flat competency_gaps
    academic_profile["competency_gaps"] = academic_profile["gap_map"]["mandatory"]

    # Hide semester plan for free users (too premium)
    academic_profile["semester_plan"] = []

    # Hide full career recommendations (show max 1)
    careers = academic_profile.get("career_recommendations", [])
    academic_profile["career_recommendations"] = careers[:1]

    academic_profile["is_premium_analysis"] = False
    return academic_profile, limited_courses


@shared_task
def analyze_curriculum_task(curriculum_id, mahasiswa_id, target_prodi=None):
    """
    Asynchronously extracts text from the curriculum document,
    calls the LLM service for course matching with rich academic profile output,
    applies premium gating, and saves the matching results into the AIRecommendation model.
    """
    logger.info(f"Starting curriculum analysis task for curriculum_id={curriculum_id}, mahasiswa_id={mahasiswa_id}")
    try:
        curriculum = Curriculum.objects.get(id=curriculum_id)
        mahasiswa = Mahasiswa.objects.get(id=mahasiswa_id)
    except (Curriculum.DoesNotExist, Mahasiswa.DoesNotExist) as e:
        logger.error(f"Failed to find Curriculum or Mahasiswa in DB: {str(e)}")
        return

    filename = curriculum.file_name.lower()

    if not curriculum.file_url:
        logger.error(f"Curriculum {curriculum_id} does not have an associated file.")
        return

    try:
        is_premium = getattr(mahasiswa.user, "is_premium", False)

        # Open and extract text from PDF or Excel
        with curriculum.file_url.open("rb") as f:
            if filename.endswith(".pdf"):
                text = extract_text_from_pdf(f)
            else:
                text = extract_text_from_excel(f)

        if not text or not text.strip():
            logger.warning(f"Extracted text is empty for curriculum {curriculum_id}. Falling back to default query.")
            text = "Rencana belajar kurikulum"

        # Retrieve all courses from DB for comparison
        courses = Course.objects.all().prefetch_related("modules")
        available_courses_list = [
            {
                "code": c.code,
                "title": c.title,
                "description": c.description,
                "sks": c.sks,
                "semester": c.semester,
                "department": c.department,
            }
            for c in courses
        ]

        prodi_name = target_prodi or mahasiswa.jurusan or "Program Studi Umum"

        # Call LLM matching service (always call with full analysis)
        raw_result = analyze_curriculum_text(
            text,
            available_courses_list,
            is_premium=is_premium,
            study_program=prodi_name,
        )

        # Normalize the result
        if isinstance(raw_result, dict):
            normalized = normalize_recommendations_payload(raw_result, prodi_name)
            academic_profile = normalized.get("academic_profile", {})
            course_matches = normalized.get("course_matches", [])
        else:
            academic_profile = {
                "completed_subjects": [],
                "competency_gaps": [],
                "career_recommendations": "Belum ada rekomendasi karir.",
                "gap_map": {"mandatory": [], "elective": [], "career": []},
                "next_best_action": "",
                "is_premium_analysis": False,
            }
            course_matches = raw_result if isinstance(raw_result, list) else []

        # Python-side validation to clean and filter completed_subjects list to prevent hallucinations
        import re
        completed_subjects = academic_profile.get("completed_subjects", [])
        if isinstance(completed_subjects, list):
            cleaned_raw_text = re.sub(r'[^a-zA-Z0-9]', '', text).lower()
            filtered_completed = []
            for subject in completed_subjects:
                if not subject:
                    continue
                cleaned_subject = re.sub(r'[^a-zA-Z0-9]', '', str(subject)).lower()
                # Check if the cleaned subject exists as a substring in the cleaned raw text
                if cleaned_subject and cleaned_subject in cleaned_raw_text:
                    filtered_completed.append(subject)
            academic_profile["completed_subjects"] = filtered_completed

        # Apply premium gating
        academic_profile, course_matches = apply_premium_gating(academic_profile, course_matches, is_premium)

        # Build list of matching course details using in-memory lookup to prevent N+1 queries
        existing_codes = {c.code for c in courses}
        saved_recommendations_list = []
        for rec in course_matches:
            code = rec.get("code")
            match_pct = rec.get("match_percentage", 80)
            reason = rec.get("reason", "")

            if code in existing_codes:
                saved_recommendations_list.append({
                    "code": code,
                    "match_percentage": match_pct,
                    "reason": reason,
                })

        # Bypassing fallback recommendations (do not add mock course recommendations if empty)

        recommendations_payload = {
            "academic_profile": academic_profile,
            "course_matches": saved_recommendations_list,
        }

        # Create AIRecommendation object
        ai_recommendation = AIRecommendation.objects.create(
            mahasiswa=mahasiswa,
            curriculum=curriculum,
            recommendations_data=recommendations_payload,
        )
        logger.info(f"Successfully processed curriculum recommendation: {ai_recommendation.id} (premium={is_premium})")
    except Exception as e:
        logger.exception(f"Error processing curriculum recommendation task: {str(e)}")
        try:
            AIRecommendation.objects.create(
                mahasiswa=mahasiswa,
                curriculum=curriculum,
                recommendations_data={"status": "error", "error_message": str(e)},
            )
        except Exception as db_err:
            logger.error(f"Failed to save error state to DB: {str(db_err)}")
        raise e


@shared_task
def cleanup_old_curriculums():
    """Delete curriculum files and database entries older than 7 days to save storage."""
    from datetime import timedelta
    from django.utils import timezone
    from explore.models import Curriculum

    cutoff = timezone.now() - timedelta(days=7)
    old = Curriculum.objects.filter(uploaded_at__lt=cutoff)
    count = old.count()

    for cur in old:
        if cur.file_url:
            try:
                cur.file_url.delete(save=False)
            except Exception as e:
                logger.error(f"Error deleting file for curriculum {cur.id}: {str(e)}")

    old.delete()
    logger.info(f"Deleted {count} old curriculum records.")
    return f"Deleted {count} old curriculum records."
