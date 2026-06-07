import os
import json
import google.generativeai as genai
from courses.models import Course, CourseModule
from .pdf_service import extract_text_from_pdf
from .excel_service import extract_text_from_excel

def parse_curriculum_and_save(file_obj, filename: str, department: str = "Informatika") -> list:
    """
    Parses a curriculum PDF/Excel file, extracts course and module details using Gemini AI,
    saves them to the database, and returns the list of created/updated courses.
    """
    # 1. Extract text based on file format
    if filename.lower().endswith('.pdf'):
        text = extract_text_from_pdf(file_obj)
    elif filename.lower().endswith(('.xlsx', '.xls')):
        text = extract_text_from_excel(file_obj)
    else:
        raise ValueError("Format file tidak didukung. Harap unggah file PDF atau Excel.")

    if not text.strip():
        raise ValueError("Teks dokumen kosong atau tidak terbaca.")

    # 2. Get API Key and call Gemini
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key or api_key == "your-gemini-api-key" or api_key.strip() == "":
        raise ValueError("Kunci API Gemini tidak dikonfigurasi. Silakan atur GEMINI_API_KEY di lingkungan sistem.")

    courses_list = call_gemini_to_extract_courses(text, department)

    # 3. Save extracted courses and modules to PostgreSQL
    saved_courses = []
    for c_data in courses_list:
        code = c_data.get("code", "").strip()
        title = c_data.get("title", "").strip()
        if not code or not title:
            continue

        # Create or update Course
        course, created = Course.objects.update_or_create(
            code=code,
            defaults={
                "title": title,
                "description": c_data.get("description", ""),
                "sks": int(c_data.get("sks", 3)),
                "semester": int(c_data.get("semester", 1)),
                "department": c_data.get("department", department)
            }
        )

        # Re-create modules for the course (avoid duplicates)
        course.modules.all().delete()
        for m_data in c_data.get("modules", []):
            CourseModule.objects.create(
                course=course,
                title=m_data.get("title", ""),
                description=m_data.get("description", ""),
                order=int(m_data.get("order", 1))
            )
        saved_courses.append(course)

    return saved_courses

def call_gemini_to_extract_courses(text: str, default_department: str) -> list:
    """
    Calls Gemini API to extract courses and modules from curriculum text.
    """
    api_key = os.environ.get("GEMINI_API_KEY", "")
    prompt = f"""
Anda adalah pakar kurikulum perguruan tinggi di Indonesia.
Tugas Anda adalah membaca teks dokumen kurikulum berikut, mengekstrak data semua mata kuliah beserta modul pembelajarannya, lalu mengembalikannya dalam format JSON.

Berikut adalah teks kurikulum:
---
{text}
---

Ekstrak semua mata kuliah yang tercantum dalam teks di atas. Untuk setiap mata kuliah, temukan juga modul-modul bab pembelajarannya jika ada. Jika tidak ada modul bab yang eksplisit, buatlah 3-4 modul logis berdasarkan silabus mata kuliah tersebut.

Format output HARUS berupa valid JSON array of objects dengan struktur persis seperti berikut (jangan sertakan penjelasan tambahan, gunakan hanya kode valid JSON):
[
  {{
    "code": "KODE_MATA_KULIAH (misal: IF102)",
    "title": "Nama Mata Kuliah (misal: Dasar Pemrograman)",
    "description": "Deskripsi ringkas mata kuliah ini.",
    "sks": 3,
    "semester": 1,
    "department": "{default_department}",
    "modules": [
      {{
        "title": "Nama Modul (misal: Pengenalan Tipe Data)",
        "description": "Deskripsi modul/materi.",
        "order": 1
      }}
    ]
  }}
]
"""
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-flash-latest')
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Clean markdown tags
        if response_text.startswith("```"):
            lines = response_text.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].startswith("```"):
                lines = lines[:-1]
            response_text = "\n".join(lines).strip()
            
        return json.loads(response_text)
    except Exception as e:
        print(f"Error calling Gemini in curriculum service: {str(e)}")
        raise e
