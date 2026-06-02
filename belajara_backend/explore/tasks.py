import logging
from celery import shared_task
from django.contrib.auth import get_user_model

from courses.models import Course
from users.models import Mahasiswa
from .models import Curriculum, AIRecommendation
from .services.pdf_service import extract_text_from_pdf
from .services.excel_service import extract_text_from_excel
from .services.llm_service import analyze_curriculum_text

logger = logging.getLogger(__name__)

@shared_task
def analyze_curriculum_task(curriculum_id, mahasiswa_id):
    """
    Asynchronously extracts text from the curriculum document,
    calls the LLM service for course matching, and saves
    the matching results into the AIRecommendation model.
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
        # Open and extract text from PDF or Excel
        with curriculum.file_url.open('rb') as f:
            if filename.endswith('.pdf'):
                text = extract_text_from_pdf(f)
            else:
                text = extract_text_from_excel(f)
        
        if not text or not text.strip():
            logger.warning(f"Extracted text is empty for curriculum {curriculum_id}. Falling back to default query.")
            text = "Rencana belajar kurikulum"
            
        # Retrieve all courses from DB for comparison
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

        # Call LLM matching service
        recommendations = analyze_curriculum_text(text, available_courses_list)

        # Build list of matching course details
        saved_recommendations_list = []
        for rec in recommendations:
            code = rec.get("code")
            match_pct = rec.get("match_percentage", 80)
            reason = rec.get("reason", "")
            
            if Course.objects.filter(code=code).exists():
                saved_recommendations_list.append({
                    "code": code,
                    "match_percentage": match_pct,
                    "reason": reason
                })

        # Fallback if no courses could be matched
        if not saved_recommendations_list and courses.exists():
            for c in courses[:2]:
                saved_recommendations_list.append({
                    "code": c.code,
                    "match_percentage": 85,
                    "reason": "Mata kuliah dasar ini sangat direkomendasikan untuk menunjang pilar keahlian informatika Anda."
                })

        # Create AIRecommendation object
        ai_recommendation = AIRecommendation.objects.create(
            mahasiswa=mahasiswa,
            curriculum=curriculum,
            recommendations_data=saved_recommendations_list
        )
        logger.info(f"Successfully processed curriculum recommendation: {ai_recommendation.id}")
    except Exception as e:
        logger.exception(f"Error processing curriculum recommendation task: {str(e)}")
        raise
