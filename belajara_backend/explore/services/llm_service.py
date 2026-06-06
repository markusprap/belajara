import os
import json
import google.generativeai as genai

DEFAULT_COMPETENCY_KEYS = [
    "core_foundation",
    "analysis_research",
    "professional_practice",
    "digital_data",
    "communication_ethics",
]


def clamp_score(value, default=50):
    try:
        return max(0, min(100, int(value)))
    except (TypeError, ValueError):
        return default


def normalize_gap(gap):
    if isinstance(gap, dict):
        return {
            "gap": str(gap.get("gap") or gap.get("name") or "Gap kompetensi"),
            "priority": gap.get("priority") if gap.get("priority") in ("high", "medium", "low") else "medium",
            "reason": str(gap.get("reason") or "Perlu diperkuat berdasarkan dokumen akademik."),
            "suggested_action": str(gap.get("suggested_action") or "Ambil mata kuliah atau latihan terkait."),
        }
    return {
        "gap": str(gap),
        "priority": "medium",
        "reason": "Terdeteksi sebagai area yang belum cukup kuat dari dokumen akademik.",
        "suggested_action": "Prioritaskan mata kuliah atau proyek yang menutup gap ini.",
    }


def normalize_career(career, study_program):
    if isinstance(career, dict):
        return {
            "title": str(career.get("title") or career.get("role") or f"Profesional {study_program}"),
            "fit_score": clamp_score(career.get("fit_score"), 70),
            "missing_skills": career.get("missing_skills") if isinstance(career.get("missing_skills"), list) else [],
            "why": str(career.get("why") or career.get("reason") or "Selaras dengan kompetensi akademik yang terdeteksi."),
        }
    return {
        "title": str(career),
        "fit_score": 72,
        "missing_skills": [],
        "why": "Rekomendasi karier dari analisis dokumen akademik.",
    }


def normalize_academic_profile(profile, study_program):
    profile = profile if isinstance(profile, dict) else {}
    completed_subjects = profile.get("completed_subjects")
    if not isinstance(completed_subjects, list):
        completed_subjects = []

    raw_gaps = profile.get("competency_gaps")
    if not isinstance(raw_gaps, list):
        raw_gaps = []

    competency_scores = profile.get("competency_scores")
    if not isinstance(competency_scores, dict):
        competency_scores = {}
    competency_scores = {
        key: clamp_score(competency_scores.get(key), 45)
        for key in DEFAULT_COMPETENCY_KEYS
    } | {
        str(key): clamp_score(value, 45)
        for key, value in competency_scores.items()
        if key not in DEFAULT_COMPETENCY_KEYS
    }

    evidence = profile.get("competency_evidence")
    if not isinstance(evidence, list):
        evidence = []
    normalized_evidence = []
    for item in evidence:
        if isinstance(item, dict):
            normalized_evidence.append({
                "competency": str(item.get("competency") or "Kompetensi akademik"),
                "evidence": str(item.get("evidence") or "Bukti tidak tersedia."),
                "confidence": clamp_score(item.get("confidence"), 70),
            })

    career_recommendations = profile.get("career_recommendations")
    if isinstance(career_recommendations, str):
        raw_careers = [
            item.strip()
            for item in career_recommendations.replace(";", ",").split(",")
            if item.strip()
        ]
    elif isinstance(career_recommendations, list):
        raw_careers = career_recommendations
    else:
        raw_careers = []

    semester_plan = profile.get("semester_plan")
    if not isinstance(semester_plan, list):
        semester_plan = [
            {
                "term": "Semester Berikutnya",
                "focus": "Tutup gap prioritas tertinggi",
                "actions": ["Ambil 2-3 mata kuliah inti", "Kerjakan proyek kecil berbasis dokumen/transkrip"],
            },
            {
                "term": "2 Semester Mendatang",
                "focus": "Validasi arah karier",
                "actions": ["Pilih mata kuliah peminatan", "Bangun portofolio atau studi kasus"],
            },
        ]

    readiness_score = profile.get("readiness_score")
    if readiness_score is None:
        score_values = list(competency_scores.values()) or [50]
        readiness_score = round(sum(score_values) / len(score_values))

    return {
        "study_program": profile.get("study_program") or study_program,
        "detected_semester": profile.get("detected_semester"),
        "readiness_score": clamp_score(readiness_score, 50),
        "confidence_score": clamp_score(profile.get("confidence_score"), 72),
        "completed_subjects": completed_subjects,
        "competency_scores": competency_scores,
        "competency_evidence": normalized_evidence,
        "competency_gaps": [normalize_gap(gap) for gap in raw_gaps],
        "career_recommendations": [normalize_career(career, study_program) for career in raw_careers],
        "semester_plan": semester_plan,
        "summary": str(profile.get("summary") or f"Analisis akademik untuk program studi {study_program}."),
    }


def normalize_recommendations_payload(payload, study_program):
    payload = payload if isinstance(payload, dict) else {}
    return {
        "academic_profile": normalize_academic_profile(
            payload.get("academic_profile", {}),
            study_program,
        ),
        "course_matches": payload.get("course_matches", []) if isinstance(payload.get("course_matches"), list) else [],
    }

def analyze_curriculum_text(
    text: str,
    available_courses: list,
    is_premium: bool = False,
    study_program: str = "Program Studi Umum",
) -> dict:
    """
    Calls the Gemini API to analyze the student's transcript/academic text,
    identify completed subjects, learning gaps, career recommendations,
    and then recommend matching Belajara courses.
    """
    api_key = os.environ.get("GEMINI_API_KEY", "")
    
    # Check if API key is invalid/placeholder
    if not api_key or api_key == "your-gemini-api-key" or api_key.strip() == "":
        return get_mock_recommendations(available_courses, is_premium, study_program)

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

Program studi mahasiswa: {study_program}

Berikut adalah daftar katalog mata kuliah Belajara yang tersedia:
{courses_str}

Format output HARUS berupa JSON valid tanpa tag markdown seperti ```json ... ``` atau teks penjelasan tambahan lainnya. JSON harus memiliki struktur persis seperti berikut:
{{
  "academic_profile": {{
    "study_program": "{study_program}",
    "detected_semester": 4,
    "readiness_score": 72,
    "confidence_score": 80,
    "summary": "Ringkasan 1-2 kalimat tentang posisi akademik mahasiswa.",
    "completed_subjects": ["Daftar mata kuliah/kompetensi yang sudah diselesaikan berdasarkan dokumen saja"],
    "competency_scores": {{
      "core_foundation": 70,
      "analysis_research": 60,
      "professional_practice": 55,
      "digital_data": 65,
      "communication_ethics": 75
    }},
    "competency_evidence": [
      {{
        "competency": "Nama kompetensi",
        "evidence": "Kutipan pendek atau alasan dari dokumen yang mendukung skor ini",
        "confidence": 80
      }}
    ],
    "competency_gaps": [
      {{
        "gap": "Nama gap kompetensi",
        "priority": "high",
        "reason": "Mengapa gap ini penting untuk program studi dan profil mahasiswa",
        "suggested_action": "Aksi belajar spesifik"
      }}
    ],
    "career_recommendations": [
      {{
        "title": "Nama jalur karier",
        "fit_score": 78,
        "missing_skills": ["Skill yang perlu dikejar"],
        "why": "Alasan jalur ini cocok"
      }}
    ],
    "semester_plan": [
      {{
        "term": "Semester Berikutnya",
        "focus": "Fokus pembelajaran",
        "actions": ["Aksi 1", "Aksi 2"]
      }}
    ]
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
        return normalize_recommendations_payload(recommendations, study_program)
    except Exception as e:
        # Log error locally and return mock response to ensure app stability
        print(f"Error calling Gemini: {str(e)}")
        return get_mock_recommendations(available_courses, is_premium, study_program)


def get_mock_recommendations(
    available_courses: list,
    is_premium: bool = False,
    study_program: str = "Program Studi Umum",
) -> dict:
    """
    Returns mock course recommendations in the dictionary format.
    """
    prodi = study_program or "Program Studi Umum"
    mock_profile = {
        "completed_subjects": [
            f"Pengantar {prodi}",
            f"Dasar Keilmuan {prodi}",
            "Metode Penelitian"
        ],
        "competency_gaps": [
            f"Pendalaman kompetensi inti {prodi}",
            "Analisis kuantitatif dan literasi data",
            "Etika profesi dan komunikasi akademik"
        ],
        "career_recommendations": f"Jalur karir profesional dan akademik yang relevan dengan {prodi}."
    }
    
    recs = []
    if len(available_courses) > 0:
        course1 = next((c for c in available_courses if c['code'] == 'IF101'), available_courses[0])
        recs.append({
            "code": course1["code"],
            "match_percentage": 95,
            "reason": f"Mata kuliah ini relevan untuk memperkuat kompetensi inti program studi {prodi}."
        })
    if len(available_courses) > 1:
        course2 = next((c for c in available_courses if c['code'] == 'IF201'), available_courses[1])
        recs.append({
            "code": course2["code"],
            "match_percentage": 88,
            "reason": "Mata kuliah ini membantu menutup gap analisis, metodologi, atau penerapan lintas bidang yang terdeteksi dari dokumen."
        })
        
    payload = {
        "academic_profile": mock_profile,
        "course_matches": recs
    }
    return normalize_recommendations_payload(payload, prodi)
