import os
import json
import google.generativeai as genai
from courses.models import Course

def analyze_curriculum_text(text: str, available_courses: list, is_premium: bool = False) -> dict:
    """
    Calls the Gemini API to analyze the student's transcript/academic text,
    identify completed subjects, learning gaps, career recommendations,
    and then recommend matching Belajara courses.
    """
    api_key = os.environ.get("GEMINI_API_KEY", "")
    
    # Check if API key is invalid/placeholder
    if not api_key or api_key == "your-gemini-api-key" or api_key.strip() == "":
        return get_mock_recommendations(available_courses, is_premium)

    # Format available courses for prompt
    courses_str = ""
    for c in available_courses:
        courses_str += f"- Code: {c['code']}, Title: {c['title']}, Description: {c['description']}, SKS: {c['sks']}, Semester: {c['semester']}\n"

    prompt = f"""
Anda adalah AI Konsultan Akademik dan Karir untuk mahasiswa Indonesia di platform Belajara.
Tugas Anda dilakukan dalam 2 langkah utama:

Langkah 1: Analisis Dokumen Akademik Pengguna
Analisis teks transkrip nilai, kurikulum, atau rencana studi yang diunggah oleh mahasiswa berikut. 
Identifikasi:
1. Mata kuliah/kompetensi yang sudah diselesaikan atau dikuasai oleh mahasiswa (Completed Subjects).
2. Kesenjangan kompetensi (Competency Gaps) yang perlu mereka ambil selanjutnya untuk menunjang pembelajaran mereka.
3. Rekomendasi jalur karir industri yang paling cocok berdasarkan profil akademis mereka saat ini.

Langkah 2: Pencocokan dengan Katalog Kelas Belajara
Cari mata kuliah di katalog Belajara kami yang paling cocok untuk menutup kesenjangan kompetensi (Competency Gaps) yang telah Anda identifikasi di Langkah 1.
Pilih maksimal 3 mata kuliah dari katalog Belajara yang paling relevan.

Berikut adalah teks dokumen akademik pengguna:
---
{text}
---

Berikut adalah daftar katalog mata kuliah Belajara yang tersedia:
{courses_str}

Format output HARUS berupa JSON valid tanpa tag markdown seperti ```json ... ``` atau teks penjelasan tambahan lainnya. JSON harus memiliki struktur persis seperti berikut:
{{
  "academic_profile": {{
    "completed_subjects": ["Daftar mata kuliah yang sudah diselesaikan berdasarkan dokumen saja"],
    "competency_gaps": ["Daftar kesenjangan kompetensi yang perlu dipelajari berdasarkan analisis dokumen saja"],
    "career_recommendations": "Deskripsi singkat mengenai prospek karir yang direkomendasikan"
  }},
  "course_matches": [
    {{
      "code": "KODE_MATA_KULIAH_BELAJARA",
      "match_percentage": 90,
      "reason": "Penjelasan mengapa mata kuliah katalog ini direkomendasikan untuk menutup kesenjangan kompetensi tersebut."
    }}
  ]
}}
"""

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-flash-latest')
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Strip markdown format if present
        if response_text.startswith("```"):
            lines = response_text.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].startswith("```"):
                lines = lines[:-1]
            response_text = "\n".join(lines).strip()
            
        recommendations = json.loads(response_text)
        return recommendations
    except Exception as e:
        # Log error locally and return mock response to ensure app stability
        print(f"Error calling Gemini: {str(e)}")
        return get_mock_recommendations(available_courses, is_premium)


def get_mock_recommendations(available_courses: list, is_premium: bool = False) -> dict:
    """
    Returns mock course recommendations in the dictionary format.
    """
    mock_profile = {
        "completed_subjects": [
            "Pemrograman Dasar (Python)",
            "Logika & Matematika Dasar"
        ],
        "competency_gaps": [
            "Struktur Data Dinamis & Manajemen Memori",
            "Perancangan Database Relasional (SQL)"
        ],
        "career_recommendations": "Software Engineer, Database Administrator, Backend Developer"
    }
    
    recs = []
    if len(available_courses) > 0:
        course1 = next((c for c in available_courses if c['code'] == 'IF101'), available_courses[0])
        recs.append({
            "code": course1["code"],
            "match_percentage": 95,
            "reason": "Mata kuliah Algoritma & Struktur Data ini sangat relevan untuk menutup kesenjangan kompetensi Anda di bidang Struktur Data Dinamis."
        })
    if len(available_courses) > 1:
        course2 = next((c for c in available_courses if c['code'] == 'IF201'), available_courses[1])
        recs.append({
            "code": course2["code"],
            "match_percentage": 88,
            "reason": "Mata kuliah Basis Data ini langsung mengisi kesenjangan Anda dalam penguasaan Perancangan Database Relasional & Query SQL."
        })
        
    return {
        "academic_profile": mock_profile,
        "course_matches": recs
    }

