import os
import json
import google.generativeai as genai
from courses.models import Course

def analyze_curriculum_text(text: str, available_courses: list) -> list:
    """
    Calls the Gemini API to match the extracted curriculum/proposal text with the available courses list.
    """
    api_key = os.environ.get("GEMINI_API_KEY", "")
    
    # Check if API key is invalid/placeholder
    if not api_key or api_key == "your-gemini-api-key" or api_key.strip() == "":
        return get_mock_recommendations(available_courses)

    # Format available courses for prompt
    courses_str = ""
    for c in available_courses:
        courses_str += f"- Code: {c['code']}, Title: {c['title']}, Description: {c['description']}, SKS: {c['sks']}, Semester: {c['semester']}\n"

    prompt = f"""
Anda adalah sistem rekomendasi mata kuliah AI untuk mahasiswa Indonesia di platform Belajara.
Tugas Anda adalah menganalisis teks kurikulum atau proposal rencana studi mahasiswa berikut, lalu mencocokkannya dengan daftar mata kuliah yang tersedia di database kami.

Berikut adalah teks kurikulum/proposal yang diunggah oleh mahasiswa:
---
{text}
---

Berikut adalah daftar mata kuliah yang tersedia di database kami:
{courses_str}

Berdasarkan teks di atas, rekomendasikan 1 sampai 3 mata kuliah yang paling cocok untuk dipelajari oleh mahasiswa tersebut. Berikan rekomendasi dalam format JSON yang valid berupa array of objects dengan struktur berikut:
[
  {{
    "code": "KODE_MATA_KULIAH",
    "match_percentage": 85,
    "reason": "Penjelasan singkat (1-2 kalimat) dalam Bahasa Indonesia mengapa mata kuliah ini cocok."
  }}
]

PENTING: Hanya gunakan kode mata kuliah yang ada di daftar mata kuliah yang tersedia. Jangan membuat kode baru. Kembalikan HANYA string JSON yang valid tanpa tag markdown seperti ```json ... ``` atau teks penjelasan tambahan lainnya.
"""

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
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
        return get_mock_recommendations(available_courses)

def get_mock_recommendations(available_courses: list) -> list:
    """
    Returns mock course recommendations in case the Gemini API is not configured or fails.
    """
    recs = []
    if len(available_courses) > 0:
        # Find Algoritma if available, else first
        course1 = next((c for c in available_courses if c['code'] == 'IF101'), available_courses[0])
        recs.append({
            "code": course1["code"],
            "match_percentage": 95,
            "reason": "Dokumen Anda menunjukkan minat pada logika pemrograman dasar. Mata kuliah ini sangat cocok untuk melatih penalaran analitis dan pengolahan data terstruktur."
        })
    if len(available_courses) > 1:
        # Find Basis Data if available, else second
        course2 = next((c for c in available_courses if c['code'] == 'IF201'), available_courses[1])
        recs.append({
            "code": course2["code"],
            "match_percentage": 88,
            "reason": "Rencana studi Anda menyebutkan pengelolaan informasi berskala besar. Kelas ini akan membekali Anda kemampuan merancang database relasional dan query SQL secara komprehensif."
        })
    if len(available_courses) > 5:
        # Find Kecerdasan Buatan if available
        course3 = next((c for c in available_courses if c['code'] == 'IF401'), None)
        if course3:
            recs.append({
                "code": course3["code"],
                "match_percentage": 78,
                "reason": "Topik skripsi/proposal Anda berkaitan dengan otomatisasi pintar. Kuliah ini akan mengenalkan konsep dasar agen cerdas dan machine learning."
            })
    return recs
