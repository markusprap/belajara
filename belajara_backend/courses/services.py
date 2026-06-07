import os
import google.generativeai as genai


# ─── Gemini configuration ────────────────────────────────────────────────────

def _get_model():
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key or api_key.strip() in ("", "your-gemini-api-key"):
        return None
    genai.configure(api_key=api_key)
    # Use gemini-3.5-flash for fast, long-context generation
    return genai.GenerativeModel(
        model_name="gemini-3.5-flash",
        generation_config={
            "temperature": 0.8,
            "top_p": 0.95,
            "max_output_tokens": 8192,  # Allow very long output
        },
    )


# ─── Main entry point ────────────────────────────────────────────────────────

def generate_material_draft(
    topic: str,
    template_type: str,
    subchapter_title: str = "",
    course_title: str = "",
) -> str:
    """
    Generate a comprehensive Markdown material draft for a subchapter using Gemini AI.

    Args:
        topic: The specific focus topic for the material.
        template_type: One of 'theory', 'code', 'case_study', 'evaluation'.
        subchapter_title: The subchapter title (for context).
        course_title: The parent course title (for context).

    Returns:
        A rich, comprehensive Markdown string ready to be placed in the editor.
    """
    model = _get_model()
    if model is None:
        raise ValueError("Kunci API Gemini tidak dikonfigurasi. Silakan atur GEMINI_API_KEY di lingkungan sistem.")

    prompt = _build_prompt(topic, template_type, subchapter_title, course_title)

    try:
        response = model.generate_content(prompt)
        result = response.text.strip()

        # Strip accidental markdown fence if model wraps output
        if result.startswith("```markdown"):
            result = result[len("```markdown"):].strip()
        if result.startswith("```"):
            result = result[3:].strip()
        if result.endswith("```"):
            result = result[:-3].strip()

        return result
    except Exception as e:
        print(f"[Belajara] Gemini material generation error: {e}")
        raise e


# ─── Prompt builders ─────────────────────────────────────────────────────────

def _build_prompt(topic: str, template_type: str, subchapter_title: str, course_title: str) -> str:
    context = ""
    if subchapter_title:
        context += f"Judul Sub-bab: {subchapter_title}\n"
    if course_title:
        context += f"Nama Kursus: {course_title}\n"

    base_instruction = f"""
Anda adalah seorang dosen berpengalaman di Indonesia yang menulis modul ajar digital berkualitas tinggi untuk platform e-learning Belajara.
Tugas Anda adalah menghasilkan **materi kuliah yang sangat lengkap, mendalam, dan komprehensif** dalam format Markdown.

{context}Topik Fokus: {topic}

PANDUAN PENULISAN WAJIB:
- Gunakan Bahasa Indonesia yang akademis, jelas, dan mudah dipahami mahasiswa S1.
- Materi harus PANJANG dan DETAIL — minimal 1.500 kata konten aktual.
- Gunakan heading hierarkis (# ## ###) untuk struktur yang jelas.
- Sisipkan tabel perbandingan, diagram teks, atau daftar poin di mana relevan.
- Berikan contoh nyata dan kontekstual dari dunia industri Indonesia/global.
- Akhiri dengan rangkuman, pertanyaan refleksi, dan referensi belajar lanjutan.
- JANGAN buat konten yang dangkal atau terlalu singkat.
- Output harus langsung berupa Markdown (tidak perlu penjelasan preamble).
"""

    if template_type == "theory":
        return base_instruction + """
JENIS KONTEN: Pembahasan Teoretis Mendalam

Struktur materi yang harus Anda tulis:

1. **Pendahuluan & Motivasi** — Mengapa topik ini penting? Berikan konteks historis dan relevansinya di era sekarang (1–2 paragraf panjang).
2. **Definisi & Konsep Inti** — Definisi formal yang tepat, beserta penjelasan intuitif dalam bahasa yang mudah dipahami. Gunakan blockquote untuk definisi resmi.
3. **Latar Belakang Teoritis** — Teori-teori pendukung, prinsip dasar, dan hubungannya dengan konsep lain yang sudah dipelajari.
4. **Komponen & Karakteristik Utama** — Uraikan setidaknya 5–7 komponen/aspek penting, masing-masing dengan penjelasan mendalam (bukan sekadar bullet point singkat).
5. **Taksonomi / Klasifikasi** — Jenis-jenis atau kategori dari konsep ini (gunakan tabel perbandingan).
6. **Analisis Perbandingan** — Bandingkan dengan pendekatan alternatif atau konsep yang serupa (tabel perbandingan minimal 4 kolom).
7. **Contoh Penerapan Nyata** — Minimal 3 contoh konkret dari industri atau kehidupan nyata.
8. **Keunggulan, Keterbatasan & Trade-off** — Analisis kritis: kapan dan mengapa konsep ini cocok digunakan, dan kapan tidak.
9. **Kaitan dengan Bidang Ilmu Lain** — Interdisciplinary connections.
10. **Rangkuman** — Poin-poin kunci dalam bullet list yang padat.
11. **Pertanyaan Refleksi & Diskusi** — Minimal 4 pertanyaan terbuka yang menantang pemikiran kritis.
12. **Referensi & Bacaan Lanjutan** — Minimal 5 referensi (buku teks, jurnal, atau sumber online terpercaya).
"""

    elif template_type == "code":
        return base_instruction + """
JENIS KONTEN: Tutorial Praktik & Implementasi Kode

Struktur materi yang harus Anda tulis:

1. **Pendahuluan** — Apa yang akan dipelajari dan mengapa penting untuk dipraktikkan secara langsung.
2. **Prasyarat** — Tools, library, dan pengetahuan yang harus dikuasai sebelum memulai.
3. **Konsep Inti Sebelum Kode** — Jelaskan konsep algoritma/logika secara singkat sebelum masuk ke kode.
4. **Pseudocode / Alur Algoritma** — Tulis pseudocode atau flowchart teks untuk menjelaskan alur sebelum implementasi.
5. **Implementasi Dasar** — Kode Python/JavaScript/Java yang bersih dengan komentar penjelasan di setiap baris penting (code block lengkap).
6. **Penjelasan Kode Baris-per-Baris** — Breakdown detail setiap bagian kode yang penting.
7. **Analisis Kompleksitas** — Time complexity dan Space complexity dengan penjelasan matematisnya.
8. **Variasi & Pengembangan** — Minimal 2 variasi implementasi yang berbeda (misalnya: iteratif vs rekursif).
9. **Contoh Input/Output** — Tabel yang menampilkan berbagai kasus input dan output yang diharapkan.
10. **Kasus Edge Case & Penanganan Error** — Apa yang terjadi dengan input kosong, nilai negatif, dll.
11. **Optimasi Kode** — Cara meningkatkan performa implementasi dasar.
12. **Latihan Mandiri** — Minimal 3 tugas coding dengan tingkat kesulitan bertahap (mudah → menengah → sulit).
13. **Referensi Dokumentasi Resmi** — Link ke dokumentasi library/bahasa yang digunakan.
"""

    elif template_type == "case_study":
        return base_instruction + """
JENIS KONTEN: Studi Kasus Industri & Analisis Mendalam

Struktur materi yang harus Anda tulis:

1. **Pendahuluan & Konteks Bisnis** — Latar belakang mengapa topik ini relevan di industri modern.
2. **Profil Perusahaan/Institusi** — Deskripsi singkat perusahaan atau situasi yang menjadi studi kasus (nyata atau fiktif tapi realistis).
3. **Identifikasi Masalah** — Masalah konkret yang dihadapi, dengan data dan metrik kuantitatif.
4. **Analisis Akar Masalah (Root Cause Analysis)** — Gunakan pendekatan 5-Why atau fishbone diagram (dalam format teks/tabel).
5. **Alternatif Solusi yang Dipertimbangkan** — Minimal 3 opsi solusi yang dievaluasi (tabel pro/kontra setiap opsi).
6. **Solusi yang Dipilih & Implementasinya** — Detail teknis solusi yang diimplementasikan menggunakan konsep yang dipelajari.
7. **Tantangan & Hambatan** — Kendala yang ditemui selama implementasi dan cara mengatasinya.
8. **Hasil & Dampak Terukur** — Tabel metrik performa sebelum vs sesudah implementasi (minimal 5 indikator KPI).
9. **Pelajaran yang Dipetik (Lessons Learned)** — Insight kritis dari keberhasilan dan kegagalan.
10. **Skalabilitas & Replikasi** — Bagaimana solusi ini bisa diadaptasi ke konteks lain.
11. **Pertanyaan Analisis Kritis** — Minimal 4 pertanyaan deep-dive untuk diskusi kelompok.
12. **Referensi & Sumber Data** — Sitasi data dan literatur yang mendukung.
"""

    else:  # evaluation
        return base_instruction + """
JENIS KONTEN: Bank Soal Latihan & Evaluasi Komprehensif

Struktur materi yang harus Anda tulis:

1. **Petunjuk Pengerjaan** — Cara menggunakan modul latihan ini secara efektif.
2. **Peta Kompetensi yang Diuji** — Taksonomi Bloom: dari C1 (ingatan) hingga C6 (evaluasi/kreasi).
3. **Latihan Tingkat 1 — Pemahaman Konsep (5 soal pilihan ganda)** — Jawaban dan pembahasan mendetail untuk setiap soal.
4. **Latihan Tingkat 2 — Analisis (3 soal esai singkat)** — Pertanyaan terbuka dengan panduan jawaban yang diharapkan.
5. **Latihan Tingkat 3 — Aplikasi (2 soal kasus/problem-solving)** — Soal kontekstual dengan langkah penyelesaian terstruktur.
6. **Latihan Tingkat 4 — Evaluasi & Sintesis (1 soal proyek mini)** — Tugas kreatif yang menggabungkan beberapa konsep.
7. **Kunci Jawaban Terannottasi** — Jawaban lengkap + penjelasan mengapa jawaban salah itu salah.
8. **Panduan Belajar Berdasarkan Hasil** — Jika nilainya rendah di bagian X, pelajari kembali Y.
9. **Soal Tantangan Ekstra** — 2 soal tingkat lanjut untuk mahasiswa yang ingin mendalami lebih jauh.
10. **Referensi Materi Pendukung** — Daftar bab atau sub-bab yang perlu dibaca untuk memahami setiap soal.
| Soal 2 | B | 10 poin |
| Soal 3 | Essay — lihat panduan | 25 poin |
| Soal 4 | Essay — lihat panduan | 25 poin |
| Soal 5 | Analisis kasus | 30 poin |

**Total: 100 poin**

## Panduan Belajar Berdasarkan Hasil

- **80–100 poin:** Pemahaman sangat baik. Lanjutkan ke modul berikutnya.
- **60–79 poin:** Ulangi bagian Karakteristik Utama dan Analisis Perbandingan.
- **< 60 poin:** Baca ulang seluruh materi dari awal sebelum mengerjakan ulang.
"""
