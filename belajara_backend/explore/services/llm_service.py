import os
import json
import google.generativeai as genai


# ─────────────────────────────────────────────
#  Rumpun → default competency keys (fallback)
# ─────────────────────────────────────────────
RUMPUN_COMPETENCY_KEYS: dict[str, list[str]] = {
    "computing": ["software_engineering", "data_ai", "system_architecture", "math_logic", "digital_business"],
    "engineering": ["engineering_math", "design_analysis", "materials_process", "systems_control", "safety_project"],
    "business": ["finance_accounting", "marketing", "operations_logistics", "strategy_entrepreneurship", "org_people"],
    "socialHumanities": ["theory_society", "policy_law", "communication_media", "research_methods", "ethics_culture"],
    "education": ["pedagogy", "subject_mastery", "assessment", "classroom_technology", "guidance_ethics"],
    "science": ["math_statistics", "lab_experiment", "natural_systems", "data_modeling", "research_method"],
    "health": ["biomedical_core", "clinical_care", "public_health", "health_systems", "ethics_safety"],
    "agriculture": ["production_cultivation", "soil_ecosystem", "food_postharvest", "agribusiness", "research_fieldwork"],
    "artsCulture": ["creative_practice", "history_theory", "language_literacy", "production_media", "portfolio_research"],
    "tourism": ["hospitality_operations", "destination_management", "culinary_service", "marketing_event", "sustainability"],
    "general": ["core_foundation", "analysis_research", "professional_practice", "digital_data", "communication_ethics"],
}

DEFAULT_COMPETENCY_KEYS = RUMPUN_COMPETENCY_KEYS["general"]


def clamp_score(value, default=50):
    try:
        return max(0, min(100, int(value)))
    except (TypeError, ValueError):
        return default


def normalize_evidence(raw_evidence: list) -> list:
    result = []
    for item in raw_evidence:
        if isinstance(item, dict):
            result.append({
                "competency": str(item.get("competency") or "Kompetensi akademik"),
                "competency_key": str(item.get("competency_key") or ""),
                "course_name": str(item.get("course_name") or item.get("competency") or "Mata kuliah terkait"),
                "text_excerpt": str(item.get("text_excerpt") or item.get("evidence") or "Bukti tidak tersedia."),
                "confidence": clamp_score(item.get("confidence"), 70),
            })
    return result


def normalize_gap(gap) -> dict:
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


def normalize_career(career, study_program: str) -> dict:
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


def normalize_gap_map(raw_gap_map, fallback_gaps: list) -> dict:
    """
    Normalizes the structured gap_map with mandatory/elective/career categories.
    Falls back to placing all gaps in mandatory if gap_map is not structured.
    """
    if isinstance(raw_gap_map, dict):
        mandatory = [normalize_gap(g) for g in raw_gap_map.get("mandatory", []) if g]
        elective = [normalize_gap(g) for g in raw_gap_map.get("elective", []) if g]
        career_gaps = []
        for g in raw_gap_map.get("career", []):
            if isinstance(g, dict):
                career_gaps.append({
                    "gap": str(g.get("gap") or "Gap karier"),
                    "target_career": str(g.get("target_career") or ""),
                    "reason": str(g.get("reason") or "Diperlukan untuk jalur karier target."),
                })
            else:
                career_gaps.append({"gap": str(g), "target_career": "", "reason": "Diperlukan untuk jalur karier target."})
        return {"mandatory": mandatory, "elective": elective, "career": career_gaps}
    
    # Fallback: treat all as mandatory
    return {
        "mandatory": [normalize_gap(g) for g in fallback_gaps],
        "elective": [],
        "career": [],
    }


def normalize_academic_profile(profile, study_program: str) -> dict:
    profile = profile if isinstance(profile, dict) else {}

    completed_subjects = profile.get("completed_subjects")
    if not isinstance(completed_subjects, list):
        completed_subjects = []

    # ── Competency scores (from AI, not keyword inference) ──
    raw_scores = profile.get("competency_scores")
    if not isinstance(raw_scores, dict):
        raw_scores = {}
    competency_scores = {str(k): clamp_score(v, 45) for k, v in raw_scores.items()}
    if not competency_scores:
        for key in DEFAULT_COMPETENCY_KEYS:
            competency_scores[key] = 45

    # ── Axis labels from AI ──
    raw_axis_labels = profile.get("competency_axis_labels")
    competency_axis_labels = raw_axis_labels if isinstance(raw_axis_labels, dict) else {}

    # ── Evidence with rich text excerpts ──
    evidence = normalize_evidence(profile.get("competency_evidence") or [])

    # ── Gap map ──
    raw_gap_map = profile.get("gap_map")
    # Support legacy flat `competency_gaps` list
    legacy_gaps = profile.get("competency_gaps")
    if not isinstance(legacy_gaps, list):
        legacy_gaps = []
    gap_map = normalize_gap_map(raw_gap_map, legacy_gaps)

    # ── Career recommendations ──
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

    # ── Semester plan ──
    semester_plan = profile.get("semester_plan")
    if not isinstance(semester_plan, list):
        semester_plan = [
            {
                "term": "Semester Berikutnya",
                "focus": "Tutup gap prioritas tinggi",
                "actions": ["Ambil 2-3 mata kuliah inti yang menutup gap mandatory", "Kerjakan proyek atau portofolio berbasis kompetensi yang lemah"],
            },
            {
                "term": "2 Semester Mendatang",
                "focus": "Validasi arah karier dan bangun spesialisasi",
                "actions": ["Pilih mata kuliah peminatan sesuai Career Path Lens", "Bangun portofolio atau studi kasus untuk pasar kerja"],
            },
        ]

    # ── Readiness score ──
    readiness_score = profile.get("readiness_score")
    if readiness_score is None:
        score_values = list(competency_scores.values()) or [50]
        readiness_score = round(sum(score_values) / len(score_values))

    # ── Next best action ──
    next_best_action = str(profile.get("next_best_action") or "")
    if not next_best_action:
        # Generate a default based on gap map
        if gap_map["mandatory"]:
            top_gap = gap_map["mandatory"][0]
            next_best_action = f"Prioritaskan mata kuliah yang menutup gap '{top_gap['gap']}' — {top_gap.get('suggested_action', 'Ambil kelas terkait segera.')}"
        else:
            next_best_action = f"Perkuat kompetensi inti program studi {study_program} dan bangun portofolio untuk membuktikan keahlian Anda."

    return {
        "study_program": profile.get("study_program") or study_program,
        "detected_semester": profile.get("detected_semester"),
        "readiness_score": clamp_score(readiness_score, 50),
        "confidence_score": clamp_score(profile.get("confidence_score"), 72),
        "summary": str(profile.get("summary") or f"Analisis akademik untuk program studi {study_program}."),
        "completed_subjects": completed_subjects,
        "competency_scores": competency_scores,
        "competency_axis_labels": competency_axis_labels,
        "competency_evidence": evidence,
        "gap_map": gap_map,
        # Keep legacy flat list for backward compat (union of all gap types)
        "competency_gaps": gap_map["mandatory"] + gap_map["elective"],
        "career_recommendations": [normalize_career(c, study_program) for c in raw_careers],
        "semester_plan": semester_plan,
        "next_best_action": next_best_action,
    }


def normalize_recommendations_payload(payload, study_program: str) -> dict:
    payload = payload if isinstance(payload, dict) else {}
    return {
        "academic_profile": normalize_academic_profile(
            payload.get("academic_profile", {}),
            study_program,
        ),
        "course_matches": payload.get("course_matches", []) if isinstance(payload.get("course_matches"), list) else [],
    }


def build_competency_dimensions_hint(study_program: str) -> str:
    """
    Returns a natural language hint for the AI about which competency dimensions
    to use for the given study program.
    """
    prodi_lower = study_program.lower()

    if any(k in prodi_lower for k in ["hukum", "ilmu hukum"]):
        return """Gunakan 5 dimensi kompetensi KHUSUS HUKUM:
- hukum_dasar: Hukum Dasar & Pengantar (nilai berdasarkan Pengantar Hukum, Teori Hukum, Hukum Tata Negara)
- hukum_perdata: Hukum Perdata & Bisnis (nilai berdasarkan Hukum Perdata, Hukum Dagang, Hukum Kontrak)
- hukum_pidana: Hukum Pidana (nilai berdasarkan Hukum Pidana, Hukum Acara Pidana, Kriminologi)
- hukum_acara: Hukum Acara & Praktik (nilai berdasarkan Hukum Acara Perdata, Hukum Acara Pidana, Praktik Peradilan)
- etika_profesi: Etika & Profesi Hukum (nilai berdasarkan Etika Hukum, Advokat, Notariat)"""

    if any(k in prodi_lower for k in ["farmasi", "apoteker"]):
        return """Gunakan 5 dimensi kompetensi KHUSUS FARMASI:
- kimia_farmasi: Kimia Farmasi (nilai berdasarkan Kimia Farmasi, Kimia Medisinal, Analisis Farmasi)
- farmakologi: Farmakologi & Toksikologi (nilai berdasarkan Farmakologi, Toksikologi, Farmasi Klinis)
- farmasetika: Farmasetika & Teknologi Farmasi (nilai berdasarkan Farmasetika, Teknologi Sediaan)
- biologi_klinis: Biologi & Ilmu Klinis (nilai berdasarkan Biologi, Anatomi, Patologi, Mikrobiologi)
- praktik_profesi: Praktik Profesi (nilai berdasarkan PKL, KKN, Seminar, Skripsi)"""

    if any(k in prodi_lower for k in ["kedokteran", "dokter"]):
        return """Gunakan 5 dimensi kompetensi KHUSUS KEDOKTERAN:
- ilmu_biomedik: Ilmu Biomedik Dasar (Anatomi, Fisiologi, Biokimia, Histologi)
- ilmu_klinis: Ilmu Klinis (Patologi, Farmakologi, Ilmu Penyakit Dalam, Bedah)
- komunitas_pencegahan: Kedokteran Komunitas & Preventif (IKM, Epidemiologi, Promosi Kesehatan)
- keterampilan_klinis: Keterampilan Klinis (Diagnosis, Anamnesis, Tindakan Medik)
- etika_humaniora: Etika & Humaniora Kedokteran (Etika Medis, Komunikasi, Hukum Kesehatan)"""

    if any(k in prodi_lower for k in ["psikologi"]):
        return """Gunakan 5 dimensi kompetensi KHUSUS PSIKOLOGI:
- teori_psikologi: Teori Psikologi (Psikologi Umum, Kepribadian, Perkembangan, Sosial)
- asesmen_psikologi: Asesmen & Diagnostik (Psikodiagnostik, Psikometri, Observasi & Wawancara)
- psikologi_klinis: Psikologi Klinis & Konseling (Psikologi Abnormal, Konseling, Psikoterapi)
- psikologi_terapan: Psikologi Terapan (Psikologi Industri, Pendidikan, Forensik)
- riset_etika: Riset & Etika Profesi (Metode Penelitian, Statistika, Etika Psikologi)"""

    if any(k in prodi_lower for k in ["akuntansi"]):
        return """Gunakan 5 dimensi kompetensi KHUSUS AKUNTANSI:
- financial_accounting: Akuntansi Keuangan (Akuntansi Keuangan, Pelaporan Keuangan, SAK)
- managerial_accounting: Akuntansi Manajemen (Akuntansi Biaya, Akuntansi Manajemen, Anggaran)
- auditing: Auditing & Assurance (Pengauditan, Audit Internal, Etika Auditor)
- taxation: Perpajakan (Perpajakan, PPh, PPN, Brevet)
- accounting_information_systems: Sistem Informasi Akuntansi (SIA, Teknologi Akuntansi)"""

    if any(k in prodi_lower for k in ["manajemen"]):
        return """Gunakan 5 dimensi kompetensi KHUSUS MANAJEMEN:
- strategic_management: Manajemen Strategis (Manajemen Strategis, Kebijakan Bisnis, Pengambilan Keputusan)
- finance_accounting: Keuangan & Akuntansi (Manajemen Keuangan, Akuntansi, Investasi, Pasar Modal)
- marketing: Pemasaran (Manajemen Pemasaran, Perilaku Konsumen, Riset Pasar, Digital Marketing)
- operations_logistics: Operasional & Logistik (Manajemen Operasional, SCM, Logistik)
- hr_organization: SDM & Organisasi (MSDM, Perilaku Organisasi, Kepemimpinan)"""

    if any(k in prodi_lower for k in ["informatika", "ilmu komputer", "teknik informatika", "computer science"]):
        return """Gunakan 5 dimensi kompetensi KHUSUS INFORMATIKA:
- software_engineering: Rekayasa Perangkat Lunak (Algoritma, Pemrograman, RPL, OOP, Web Dev)
- data_ai: Data Science & AI (Machine Learning, Data Mining, AI, Statistika, Visualisasi)
- system_architecture: Arsitektur Sistem (Sistem Operasi, Jaringan, Cloud, Infrastruktur)
- math_logic: Matematika & Logika (Matematika Diskrit, Kalkulus, Aljabar, Teori Komputasi)
- digital_business: Digital Business (SPK, Manajemen Proyek, Sistem Informasi Manajemen)"""

    if any(k in prodi_lower for k in ["sistem informasi"]):
        return """Gunakan 5 dimensi kompetensi KHUSUS SISTEM INFORMASI:
- software_engineering: Rekayasa Perangkat Lunak (Analisis Sistem, Perancangan, Pemrograman)
- data_analytics: Data & Analitik Bisnis (Data Mining, BI, Visualisasi, Statistika)
- enterprise_architecture: Arsitektur Enterprise (Enterprise Arch, Tata Kelola TI, Cloud)
- quantitative_methods: Metode Kuantitatif (Matematika, Statistika, Riset Operasi)
- business_systems: Sistem Bisnis (SIM, SPK, ERP, Manajemen Proyek TI)"""

    if any(k in prodi_lower for k in ["teknik", "engineering"]):
        return """Gunakan 5 dimensi kompetensi KHUSUS TEKNIK:
- engineering_math: Matematika & Sains Teknik (Kalkulus, Fisika, Statistika, Numerik)
- design_analysis: Desain & Analisis (Gambar Teknik, Perancangan, Analisis Struktur/Sistem)
- materials_process: Material & Proses (Material, Proses Produksi, Manufaktur, Kimia)
- systems_control: Sistem & Kontrol (Kontrol, Instrumentasi, Otomasi, Jaringan)
- safety_project: Keselamatan & Proyek (K3, Etika Profesi, Manajemen Proyek)"""

    if any(k in prodi_lower for k in ["pendidikan", "keguruan", "pgsd", "paud"]):
        return """Gunakan 5 dimensi kompetensi KHUSUS PENDIDIKAN:
- pedagogy: Pedagogik & Landasan Pendidikan (Teori Belajar, Kurikulum, Didaktik)
- subject_mastery: Penguasaan Bidang Studi (sesuai mata pelajaran yang diajarkan)
- assessment: Evaluasi & Asesmen (Evaluasi Pembelajaran, Pengukuran, Penilaian Autentik)
- classroom_technology: Teknologi Pembelajaran (Media Pembelajaran, ICT, E-learning)
- guidance_ethics: Bimbingan & Etika Profesi (BK, Karakter, Inklusi, Etika Guru)"""

    if any(k in prodi_lower for k in ["kesehatan", "keperawatan", "kebidanan", "fisioterapi", "gizi"]):
        return """Gunakan 5 dimensi kompetensi KHUSUS KESEHATAN:
- biomedical_core: Ilmu Biomedik Dasar (Anatomi, Fisiologi, Biokimia, Patologi)
- clinical_care: Asuhan Klinis / Profesi (Keperawatan, Kebidanan, Terapi, Dietisien)
- public_health: Kesehatan Masyarakat (IKM, Epidemiologi, Gizi Masyarakat)
- health_systems: Sistem Layanan Kesehatan (Administrasi RS, Rekam Medis, Kebijakan)
- ethics_safety: Etika & Keselamatan (Etika Profesi, Keselamatan Pasien, Komunikasi)"""

    # Default untuk prodi yang tidak teridentifikasi
    return """Gunakan 5 dimensi kompetensi UMUM yang relevan untuk program studi ini:
- core_foundation: Fondasi Inti (mata kuliah inti dan wajib prodi)
- analysis_research: Analisis & Riset (metode penelitian, statistika, analisis data)
- professional_practice: Praktik Profesional (praktikum, magang, proyek nyata)
- digital_data: Digital & Data (teknologi, sistem informasi, komputasi)
- communication_ethics: Komunikasi & Etika (bahasa, etika profesi, kepemimpinan)"""


def analyze_curriculum_text(
    text: str,
    available_courses: list,
    is_premium: bool = False,
    study_program: str = "Program Studi Umum",
) -> dict:
    """
    Calls the Gemini API to analyze the student's transcript/academic text.
    Returns a rich structured academic profile with competency scores from AI,
    gap map, evidence with text excerpts, and career/semester planning.
    """
    api_key = os.environ.get("GEMINI_API_KEY", "")

    if not api_key or api_key == "your-gemini-api-key" or api_key.strip() == "":
        return get_mock_recommendations(available_courses, is_premium, study_program)

    courses_str = ""
    for c in available_courses:
        courses_str += f"- Code: {c['code']}, Title: {c['title']}, Description: {c['description']}, SKS: {c['sks']}, Semester: {c['semester']}\n"

    competency_hint = build_competency_dimensions_hint(study_program)

    prompt = f"""Anda adalah **AI Konsultan Akademik dan Karir** untuk mahasiswa Indonesia di platform Belajara.
Analisis dokumen akademik mahasiswa dengan sangat teliti dan hasilkan output analitik yang kaya dan berbasis bukti.

PROGRAM STUDI MAHASISWA: {study_program}

{competency_hint}

---
DOKUMEN AKADEMIK MAHASISWA:
{text}
---

KATALOG KELAS BELAJARA:
{courses_str}
---

TUGAS ANALISIS:
1. Baca dokumen dan identifikasi semua mata kuliah/kompetensi yang sudah diselesaikan mahasiswa.
2. Berikan SKOR KOMPETENSI (0-100) untuk setiap dimensi berdasarkan bukti nyata dari dokumen.
3. Untuk setiap skor, berikan BUKTI KONKRIT: nama mata kuliah yang mendukung dan kutipan/petunjuk dari teks dokumen.
4. Identifikasi GAP secara terstruktur: mandatory (wajib untuk prodi), elective (opsional tapi penting), career (untuk jalur karier tertentu).
5. Rekomendasikan maksimal 3 kelas dari katalog Belajara yang paling relevan untuk menutup gap.
6. Berikan NEXT BEST ACTION: 1 kalimat aksi paling penting yang harus dilakukan mahasiswa sekarang.

OUTPUT HARUS berupa JSON valid (tanpa markdown). Struktur persis:
{{
  "academic_profile": {{
    "study_program": "{study_program}",
    "detected_semester": 4,
    "readiness_score": 72,
    "confidence_score": 80,
    "summary": "Ringkasan 2-3 kalimat tentang posisi akademik mahasiswa, kekuatan utama, dan arah yang disarankan.",
    "next_best_action": "Satu kalimat aksi konkrit paling penting berdasarkan bukti dokumen.",
    "completed_subjects": ["Nama mata kuliah 1 dari dokumen", "Nama mata kuliah 2 dari dokumen"],
    "competency_scores": {{
      "kunci_dimensi_1": 75,
      "kunci_dimensi_2": 60,
      "kunci_dimensi_3": 55,
      "kunci_dimensi_4": 70,
      "kunci_dimensi_5": 80
    }},
    "competency_axis_labels": {{
      "kunci_dimensi_1": "Label tampilan dimensi 1",
      "kunci_dimensi_2": "Label tampilan dimensi 2",
      "kunci_dimensi_3": "Label tampilan dimensi 3",
      "kunci_dimensi_4": "Label tampilan dimensi 4",
      "kunci_dimensi_5": "Label tampilan dimensi 5"
    }},
    "competency_evidence": [
      {{
        "competency": "Nama dimensi kompetensi",
        "competency_key": "kunci_dimensi_yang_sesuai",
        "course_name": "Nama mata kuliah yang menjadi bukti",
        "text_excerpt": "Kutipan singkat atau petunjuk spesifik dari teks dokumen yang mendukung skor ini (maks 100 kata)",
        "confidence": 85
      }}
    ],
    "gap_map": {{
      "mandatory": [
        {{
          "gap": "Nama gap kompetensi wajib",
          "priority": "high",
          "reason": "Mengapa gap ini wajib untuk program studi ini",
          "suggested_action": "Aksi belajar spesifik untuk menutup gap ini"
        }}
      ],
      "elective": [
        {{
          "gap": "Nama gap kompetensi pilihan",
          "priority": "medium",
          "reason": "Mengapa gap ini penting meski tidak wajib",
          "suggested_action": "Aksi belajar spesifik"
        }}
      ],
      "career": [
        {{
          "gap": "Nama gap kompetensi untuk karier tertentu",
          "target_career": "Jalur karier yang membutuhkan kompetensi ini",
          "reason": "Mengapa gap ini penting untuk target karier"
        }}
      ]
    }},
    "career_recommendations": [
      {{
        "title": "Nama jalur karier",
        "fit_score": 78,
        "missing_skills": ["Skill spesifik yang perlu dikejar"],
        "why": "Alasan berbasis bukti dari dokumen mengapa jalur ini cocok"
      }}
    ],
    "semester_plan": [
      {{
        "term": "Semester Berikutnya",
        "focus": "Fokus pembelajaran utama",
        "actions": ["Aksi spesifik 1 berbasis gap mandatory", "Aksi spesifik 2"]
      }},
      {{
        "term": "2 Semester Mendatang",
        "focus": "Fokus pembelajaran jangka menengah",
        "actions": ["Aksi spesifik 1", "Aksi spesifik 2"]
      }}
    ]
  }},
  "course_matches": [
    {{
      "code": "KODE_MATA_KULIAH_BELAJARA",
      "match_percentage": 90,
      "reason": "Penjelasan berbasis bukti mengapa kelas ini menutup gap spesifik yang teridentifikasi dari dokumen."
    }}
  ]
}}
"""

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt)
        response_text = response.text.strip()

        # Strip markdown wrapper if present
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
        print(f"Error calling Gemini: {str(e)}")
        return get_mock_recommendations(available_courses, is_premium, study_program)


def get_mock_recommendations(
    available_courses: list,
    is_premium: bool = False,
    study_program: str = "Program Studi Umum",
) -> dict:
    """
    Returns rich mock recommendations matching the new full AI output contract.
    Used when the Gemini API key is not configured or an error occurs.
    """
    prodi = study_program or "Program Studi Umum"
    prodi_lower = prodi.lower()

    # Pick relevant competency keys and labels
    if "informatika" in prodi_lower or "komputer" in prodi_lower:
        comp_scores = {"software_engineering": 68, "data_ai": 52, "system_architecture": 45, "math_logic": 72, "digital_business": 58}
        comp_labels = {"software_engineering": "Software Eng.", "data_ai": "Data Sci. & AI", "system_architecture": "System Arch.", "math_logic": "Math & Logic", "digital_business": "Digital Business"}
    elif "manajemen" in prodi_lower:
        comp_scores = {"strategic_management": 55, "finance_accounting": 60, "marketing": 70, "operations_logistics": 48, "hr_organization": 62}
        comp_labels = {"strategic_management": "Strategic Mgmt.", "finance_accounting": "Finance & Acct.", "marketing": "Marketing", "operations_logistics": "Ops & Logistics", "hr_organization": "HR & Org."}
    elif "akuntansi" in prodi_lower:
        comp_scores = {"financial_accounting": 72, "managerial_accounting": 58, "auditing": 45, "taxation": 50, "accounting_information_systems": 42}
        comp_labels = {"financial_accounting": "Financial Acct.", "managerial_accounting": "Managerial Acct.", "auditing": "Auditing", "taxation": "Taxation", "accounting_information_systems": "Acct. Info Sys."}
    elif "hukum" in prodi_lower:
        comp_scores = {"hukum_dasar": 70, "hukum_perdata": 55, "hukum_pidana": 60, "hukum_acara": 40, "etika_profesi": 65}
        comp_labels = {"hukum_dasar": "Hukum Dasar", "hukum_perdata": "Hukum Perdata", "hukum_pidana": "Hukum Pidana", "hukum_acara": "Hukum Acara", "etika_profesi": "Etika Profesi"}
    else:
        comp_scores = {"core_foundation": 62, "analysis_research": 48, "professional_practice": 55, "digital_data": 45, "communication_ethics": 70}
        comp_labels = {"core_foundation": "Fondasi Inti", "analysis_research": "Analisis & Riset", "professional_practice": "Praktik Profesional", "digital_data": "Digital & Data", "communication_ethics": "Komunikasi & Etika"}

    all_gap_keys = list(comp_scores.keys())
    weakest_key = min(comp_scores, key=lambda k: comp_scores[k])
    weakest_label = comp_labels.get(weakest_key, weakest_key)

    mock_profile = {
        "study_program": prodi,
        "detected_semester": 4,
        "readiness_score": 63,
        "confidence_score": 75,
        "summary": f"Mahasiswa {prodi} menunjukkan fondasi akademik yang solid pada beberapa mata kuliah inti. Namun, terdapat gap kompetensi pada bidang {weakest_label} yang perlu segera ditutup untuk mempersiapkan karier yang kompetitif.",
        "next_best_action": f"Segera daftar mata kuliah yang memperkuat dimensi '{weakest_label}' karena ini adalah gap prioritas tertinggi berdasarkan analisis dokumen Anda.",
        "completed_subjects": [
            f"Pengantar {prodi}",
            f"Dasar Keilmuan {prodi}",
            "Metode Penelitian",
            "Bahasa Indonesia Akademik",
            "Pendidikan Pancasila",
        ],
        "competency_scores": comp_scores,
        "competency_axis_labels": comp_labels,
        "competency_evidence": [
            {
                "competency": comp_labels.get(all_gap_keys[0], all_gap_keys[0]),
                "competency_key": all_gap_keys[0],
                "course_name": f"Pengantar {prodi}",
                "text_excerpt": f"Dokumen menunjukkan penyelesaian mata kuliah dasar {prodi} dengan nilai yang cukup baik sebagai fondasi kompetensi inti.",
                "confidence": 82,
            },
            {
                "competency": comp_labels.get(all_gap_keys[1], all_gap_keys[1]),
                "competency_key": all_gap_keys[1],
                "course_name": "Metode Penelitian",
                "text_excerpt": "Terdapat mata kuliah Metode Penelitian dalam dokumen, menunjukkan pengenalan terhadap analisis dan riset akademik.",
                "confidence": 70,
            },
        ],
        "gap_map": {
            "mandatory": [
                {
                    "gap": f"Pendalaman {weakest_label}",
                    "priority": "high",
                    "reason": f"Dimensi {weakest_label} merupakan kompetensi wajib untuk {prodi} namun belum cukup terpenuhi dari dokumen yang diunggah.",
                    "suggested_action": f"Ambil mata kuliah lanjutan di bidang {weakest_label} dan kerjakan proyek praktik nyata.",
                },
                {
                    "gap": "Analisis Data Kuantitatif",
                    "priority": "medium",
                    "reason": "Kemampuan analisis data merupakan fondasi universal untuk semua profil karier modern.",
                    "suggested_action": "Ikuti kursus analisis data atau statistika terapan.",
                },
            ],
            "elective": [
                {
                    "gap": "Keterampilan Komunikasi Profesional",
                    "priority": "medium",
                    "reason": "Soft skill komunikasi meningkatkan nilai kompetitif di pasar kerja secara signifikan.",
                    "suggested_action": "Ikuti workshop presentasi atau ambil mata kuliah komunikasi bisnis.",
                },
            ],
            "career": [
                {
                    "gap": "Portofolio Proyek Nyata",
                    "target_career": f"Profesional {prodi}",
                    "reason": "Rekruter industri menginginkan bukti praktis kemampuan, bukan hanya transkrip akademis.",
                },
            ],
        },
        "career_recommendations": [
            {
                "title": f"Spesialis {prodi}",
                "fit_score": 78,
                "missing_skills": [weakest_label, "Pengalaman Proyek Industri"],
                "why": f"Profil akademis Anda selaras dengan jalur karier {prodi} berdasarkan kompetensi inti yang terdeteksi.",
            },
            {
                "title": "Peneliti / Akademisi",
                "fit_score": 65,
                "missing_skills": ["Publikasi Ilmiah", "Metodologi Penelitian Lanjutan"],
                "why": "Penyelesaian mata kuliah Metode Penelitian menunjukkan potensi untuk jalur akademik.",
            },
        ],
        "semester_plan": [
            {
                "term": "Semester Berikutnya",
                "focus": f"Menutup gap '{weakest_label}' sebagai prioritas utama",
                "actions": [
                    f"Daftar mata kuliah lanjutan di bidang {weakest_label}",
                    "Kerjakan minimal 1 proyek praktik yang bisa masuk portofolio",
                ],
            },
            {
                "term": "2 Semester Mendatang",
                "focus": "Spesialisasi dan persiapan karier",
                "actions": [
                    "Pilih mata kuliah peminatan sesuai Career Path Lens",
                    "Mulai membangun portofolio atau studi kasus untuk pasar kerja",
                ],
            },
        ],
    }

    recs = []
    if len(available_courses) > 0:
        recs.append({
            "code": available_courses[0]["code"],
            "match_percentage": 92,
            "reason": f"Mata kuliah ini secara langsung menutup gap '{weakest_label}' yang teridentifikasi sebagai prioritas tinggi dari dokumen Anda.",
        })
    if len(available_courses) > 1:
        recs.append({
            "code": available_courses[1]["code"],
            "match_percentage": 85,
            "reason": "Mata kuliah ini memperkuat kemampuan analisis dan riset yang masih perlu diperdalam berdasarkan profil akademis Anda.",
        })

    return normalize_recommendations_payload({"academic_profile": mock_profile, "course_matches": recs}, prodi)
