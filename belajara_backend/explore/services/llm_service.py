import os
import json
import google.generativeai as genai
from courses.models import Course

def analyze_curriculum_text(text: str, available_courses: list, is_premium: bool = False) -> list:
    """
    Calls the Gemini API to match the extracted curriculum/proposal text with the available courses list.
    """
    api_key = os.environ.get("GEMINI_API_KEY", "")
    
    # Check if API key is invalid/placeholder
    if not api_key or api_key == "your-gemini-api-key" or api_key.strip() == "":
        return get_mock_recommendations(available_courses, is_premium)

    # Format available courses for prompt
    courses_str = ""
    for c in available_courses:
        courses_str += f"- Code: {c['code']}, Title: {c['title']}, Description: {c['description']}, SKS: {c['sks']}, Semester: {c['semester']}\n"

    if is_premium:
        recommendations_desc = "rekomendasikan 1 sampai 3 mata kuliah yang paling cocok. Berikan analisis tingkat lanjut yang sangat mendalam dan lengkap di field 'reason'. Penjelasan harus komprehensif, mencakup: 1) Mengapa mata kuliah ini cocok secara akademis, 2) Hubungan langsung dengan jalur karier masa depan mahasiswa berdasarkan analisis kurikulumnya, dan 3) Saran kompetensi pendukung yang harus dipelajari agar mahasiswa siap industri."
    else:
        recommendations_desc = "rekomendasikan 1 sampai 2 mata kuliah yang paling cocok. Berikan penjelasan dasar singkat (maksimal 2 kalimat) saja di field 'reason' mengapa mata kuliah ini cocok."

    prompt = f"""
Anda adalah sistem rekomendasi mata kuliah AI untuk mahasiswa Indonesia di platform Belajara.
Tugas Anda adalah menganalisis teks kurikulum atau proposal rencana studi mahasiswa berikut, lalu mencocokkannya dengan daftar mata kuliah yang tersedia di database kami.

Berikut adalah teks kurikulum/proposal yang diunggah oleh mahasiswa:
---
{text}
---

Berikut adalah daftar mata kuliah yang tersedia di database kami:
{courses_str}

Berdasarkan teks di atas, {recommendations_desc} Berikan rekomendasi dalam format JSON yang valid berupa array of objects dengan struktur berikut:
[
  {{
    "code": "KODE_MATA_KULIAH",
    "match_percentage": 85,
    "reason": "Isi analisis di sini sesuai dengan instruksi tingkat paket."
  }}
]

PENTING: Hanya gunakan kode mata kuliah yang ada di daftar mata kuliah yang tersedia. Jangan membuat kode baru. Kembalikan HANYA string JSON yang valid tanpa tag markdown seperti ```json ... ``` atau teks penjelasan tambahan lainnya.
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

def get_mock_recommendations(available_courses: list, is_premium: bool = False) -> list:
    """
    Returns mock course recommendations in case the Gemini API is not configured or fails.
    """
    recs = []
    if len(available_courses) > 0:
        # Find Algoritma if available, else first
        course1 = next((c for c in available_courses if c['code'] == 'IF101'), available_courses[0])
        reason_free = "Dokumen Anda menunjukkan minat pada logika pemrograman dasar. Mata kuliah ini sangat cocok untuk melatih penalaran analitis dan pengolahan data terstruktur."
        reason_premium = (
            "ANALISIS AKADEMIS: Dokumen Anda menunjukkan minat kuat pada logika pemrograman dasar. Kelas ini sangat cocok untuk melatih penalaran analitis.\n"
            "PROSPEK KARIER: Membuka peluang menjadi Software Engineer / Backend Developer dengan basis logika data yang kokoh.\n"
            "KOMPETENSI PENDUKUNG: Direkomendasikan mempelajari Pemrograman C++ atau Python sebelum memulai perkuliahan."
        )
        recs.append({
            "code": course1["code"],
            "match_percentage": 95,
            "reason": reason_premium if is_premium else reason_free
        })
    if len(available_courses) > 1:
        # Find Basis Data if available, else second
        course2 = next((c for c in available_courses if c['code'] == 'IF201'), available_courses[1])
        reason_free = "Rencana studi Anda menyebutkan pengelolaan informasi berskala besar. Kelas ini akan membekali Anda kemampuan merancang database relasional dan query SQL secara komprehensif."
        reason_premium = (
            "ANALISIS AKADEMIS: Rencana studi Anda menuntut pemahaman mendalam tentang data. Kelas ini membekali Anda kemampuan merancang database relasional dan SQL.\n"
            "PROSPEK KARIER: Esensial untuk posisi Data Engineer, Database Administrator, dan Web Developer.\n"
            "KOMPETENSI PENDUKUNG: Kuasai dasar DDL, DML, dan cobalah menginstal PostgreSQL secara mandiri."
        )
        recs.append({
            "code": course2["code"],
            "match_percentage": 88,
            "reason": reason_premium if is_premium else reason_free
        })
    if len(available_courses) > 5 and is_premium:
        # Find Kecerdasan Buatan if available
        course3 = next((c for c in available_courses if c['code'] == 'IF401'), None)
        if course3:
            recs.append({
                "code": course3["code"],
                "match_percentage": 78,
                "reason": (
                    "ANALISIS AKADEMIS: Topik skripsi/proposal Anda berkaitan dengan otomatisasi pintar. Kuliah ini mengenalkan konsep dasar agen cerdas.\n"
                    "PROSPEK KARIER: Relevan untuk menjadi AI Engineer, Machine Learning Specialist, atau Data Scientist.\n"
                    "KOMPETENSI PENDUKUNG: Disarankan memiliki pemahaman kalkulus dasar dan pemrograman Python tingkat lanjut."
                )
            })
            
    # For free users, limit the mock recommendation array to 2 items
    if not is_premium:
        recs = recs[:2]
        
    return recs
