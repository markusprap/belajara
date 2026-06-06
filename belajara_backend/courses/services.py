import os
import google.generativeai as genai


# ─── Gemini configuration ────────────────────────────────────────────────────

def _get_model():
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key or api_key.strip() in ("", "your-gemini-api-key"):
        return None
    genai.configure(api_key=api_key)
    # Use gemini-1.5-flash for fast, long-context generation
    return genai.GenerativeModel(
        model_name="gemini-1.5-flash",
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
        return _get_fallback_content(topic, template_type, subchapter_title)

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
        return _get_fallback_content(topic, template_type, subchapter_title)


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
"""


# ─── Fallback content (when no API key) ──────────────────────────────────────

def _get_fallback_content(topic: str, template_type: str, subchapter_title: str) -> str:
    """Returns a rich fallback template when Gemini API is not available."""
    title = subchapter_title or topic

    if template_type == "theory":
        return f"""# Pembahasan Mendalam: {title}

> ⚠️ **Catatan:** Konten ini dihasilkan dari template offline. Konfigurasikan `GEMINI_API_KEY` untuk mengaktifkan AI generation yang sesungguhnya.

## 1. Pendahuluan & Motivasi

**{topic}** merupakan salah satu konsep fundamental yang memiliki peran krusial dalam disiplin ilmu ini. Pemahaman yang mendalam terhadap topik ini tidak hanya penting secara teoritis, tetapi juga memberikan landasan kokoh untuk pengembangan kompetensi praktis di dunia industri.

Dalam era digitalisasi yang semakin pesat, penguasaan terhadap {topic} menjadi differentiator utama bagi para profesional yang ingin unggul di bidangnya. Berbagai riset menunjukkan bahwa mahasiswa yang memahami konsep ini secara menyeluruh memiliki performa yang jauh lebih baik dalam menghadapi tantangan nyata di lapangan.

## 2. Definisi & Konsep Inti

> **Definisi Formal:** {topic} didefinisikan sebagai sistem atau metodologi terstruktur yang mengintegrasikan prinsip-prinsip logis dan prosedural untuk mencapai tujuan komputasi atau analitis secara optimal dan efisien.

Secara intuitif, kita dapat memahami {topic} sebagai sebuah "peta jalan" yang memandu kita dalam menyelesaikan masalah kompleks melalui serangkaian langkah terorganisir yang terbukti efektif.

## 3. Karakteristik Utama

Berikut adalah karakteristik inti yang mendefinisikan {topic}:

| Karakteristik | Deskripsi | Signifikansi |
|---|---|---|
| **Determinisme** | Hasil yang konsisten untuk input yang sama | Memastikan predictability sistem |
| **Efisiensi** | Optimasi penggunaan sumber daya | Mengurangi biaya operasional |
| **Skalabilitas** | Kemampuan berkembang seiring data | Cocok untuk sistem enterprise |
| **Modularitas** | Dapat dipecah menjadi komponen | Memudahkan debugging & maintenance |
| **Keterbacaan** | Mudah dipahami oleh tim lain | Mendukung kolaborasi |

## 4. Analisis Perbandingan

| Dimensi | Pendekatan Tradisional | {topic} | Pendekatan Hybrid |
|---|---|---|---|
| Kompleksitas Waktu | O(n²) | O(n log n) | O(n log n) |
| Konsumsi Memori | Tinggi | Rendah | Sedang |
| Kemudahan Implementasi | Mudah | Sedang | Sedang |
| Skalabilitas | Rendah | Tinggi | Tinggi |

## 5. Contoh Penerapan Nyata

### Contoh 1: Industri Fintech
Perusahaan seperti Gojek dan OVO menerapkan prinsip {topic} dalam sistem rekomendasi produk keuangan mereka, menghasilkan peningkatan konversi hingga 34%.

### Contoh 2: E-commerce
Platform Tokopedia menggunakan {topic} untuk mengoptimalkan algoritma pencarian produk, mempersingkat waktu respons dari 800ms menjadi 45ms.

### Contoh 3: Pendidikan Digital
Platform seperti Belajara menerapkan {topic} untuk personalisasi jalur belajar mahasiswa berdasarkan profil akademis mereka.

## 6. Rangkuman

- {topic} adalah konsep esensial dengan aplikasi luas di berbagai industri
- Efisiensi dan skalabilitas adalah keunggulan utama pendekatan ini
- Pemahaman mendalam diperlukan sebelum mengimplementasikan di sistem nyata
- Selalu pertimbangkan trade-off antara kompleksitas implementasi dan manfaat yang diperoleh

## 7. Pertanyaan Refleksi & Diskusi

1. Dalam konteks sistem yang Anda kenal, di mana {topic} dapat memberikan dampak terbesar? Jelaskan alasannya.
2. Apa keterbatasan utama dari {topic} dan dalam situasi apa pendekatan lain lebih disarankan?
3. Bagaimana perkembangan teknologi AI dan Machine Learning mempengaruhi relevansi {topic} di masa depan?
4. Berikan analisis kritis: apakah selalu ada trade-off dalam penerapan {topic}? Jelaskan dengan contoh konkret.

## 8. Referensi & Bacaan Lanjutan

1. Cormen, T. H., et al. (2022). *Introduction to Algorithms* (4th ed.). MIT Press.
2. Knuth, D. E. (2011). *The Art of Computer Programming*. Addison-Wesley.
3. Sedgewick, R., & Wayne, K. (2020). *Algorithms* (4th ed.). Addison-Wesley.
4. Dokumentasi resmi: [docs.python.org](https://docs.python.org)
5. Khan Academy - Computer Science: [khanacademy.org/computing](https://khanacademy.org/computing)
"""

    elif template_type == "code":
        fn_name = topic.lower().replace(" ", "_").replace("-", "_")
        lines = [
            f"# Tutorial & Praktik: {title}",
            "",
            "> ⚠️ **Catatan:** Konten ini dihasilkan dari template offline. Konfigurasikan `GEMINI_API_KEY` untuk AI generation yang sesungguhnya.",
            "",
            "## 1. Pendahuluan",
            "",
            f"Dalam modul praktis ini, kita akan mengimplementasikan **{topic}** secara langsung menggunakan Python.",
            "",
            "## 2. Prasyarat",
            "",
            "Sebelum memulai, pastikan Anda sudah menguasai:",
            "- [ ] Variabel dan tipe data dasar Python",
            "- [ ] Konsep loop (`for`, `while`) dan kondisional (`if`/`else`)",
            "- [ ] List, dictionary, dan tuple",
            "- [ ] Fungsi dan parameter",
            "",
            "## 3. Pseudocode & Alur Algoritma",
            "",
            "```",
            f"PROCEDURE {fn_name}(input_data):",
            "    1. Validasi input_data tidak kosong",
            "    2. Inisialisasi struktur data hasil",
            "    3. Untuk setiap elemen dalam input_data:",
            "       a. Proses elemen sesuai logika utama",
            "       b. Tambahkan hasil ke struktur data",
            "    4. Kembalikan struktur data hasil",
            "END PROCEDURE",
            "```",
            "",
            "## 4. Implementasi Kode Lengkap",
            "",
            "```python",
            f"def {fn_name}(data_input: list, config: dict = None) -> dict:",
            '    """',
            f"    Implementasi {topic} untuk processing data terstruktur.",
            "    ",
            "    Args:",
            "        data_input (list): Data mentah yang akan diproses.",
            "        config (dict): Konfigurasi opsional.",
            "    ",
            "    Returns:",
            "        dict: Hasil processing dengan statistik dan data terproses.",
            '    """',
            "    if not data_input:",
            '        raise ValueError("data_input tidak boleh kosong.")',
            "    if config is None:",
            '        config = {"threshold": 0, "mode": "standard"}',
            "    ",
            "    hasil = []",
            '    statistik = {"total": len(data_input), "processed": 0, "skipped": 0}',
            "    ",
            "    for index, item in enumerate(data_input):",
            "        try:",
            '            if item > config["threshold"]:',
            "                nilai_hasil = item * 2",
            '                hasil.append({"index": index, "input": item, "output": nilai_hasil})',
            '                statistik["processed"] += 1',
            "            else:",
            '                statistik["skipped"] += 1',
            "        except (TypeError, KeyError) as e:",
            '            print(f"Peringatan: Item index {index} dilewati. Error: {e}")',
            '            statistik["skipped"] += 1',
            "    ",
            '    return {"data": hasil, "stats": statistik}',
            "",
            "",
            'if __name__ == "__main__":',
            "    dataset = [12, -5, 45, 0, 78, 23, -10, 56]",
            '    print(f"Input: {dataset}")',
            f"    hasil = {fn_name}(dataset)",
            '    print(f"Output: {hasil}")',
            "```",
            "",
            "## 5. Analisis Kompleksitas",
            "",
            "| Metrik | Nilai | Penjelasan |",
            "|---|---|---|",
            "| **Time Complexity** | O(n) | Loop tunggal melewati setiap elemen sekali |",
            "| **Space Complexity** | O(n) | Menyimpan hasil untuk setiap elemen |",
            "| **Best Case** | O(n) | Semua elemen dilewati |",
            "| **Worst Case** | O(n) | Semua elemen diproses |",
            "",
            "## 6. Contoh Input/Output",
            "",
            "| Input | Config Threshold | Output | Diproses |",
            "|---|---|---|---|",
            "| `[1, 2, 3]` | 0 | `[2, 4, 6]` | 3/3 |",
            "| `[-1, 0, 5]` | 0 | `[10]` | 1/3 |",
            "| `[]` | 0 | `ValueError` | n/a |",
            "",
            "## 7. Latihan Mandiri",
            "",
            "**Latihan 1 (Mudah):** Modifikasi fungsi agar mendukung operasi pengurangan dengan parameter yang bisa dikonfigurasi.",
            "",
            "**Latihan 2 (Menengah):** Tambahkan fitur logging ke dalam file `.log` menggunakan modul `logging` Python.",
            "",
            "**Latihan 3 (Sulit):** Implementasikan versi paralel menggunakan `concurrent.futures.ThreadPoolExecutor`.",
        ]
        return "\n".join(lines)


    else:
        return f"""# Latihan & Evaluasi: {title}

> ⚠️ **Catatan:** Konten ini dihasilkan dari template offline. Konfigurasikan `GEMINI_API_KEY` untuk AI generation yang sesungguhnya.

## Petunjuk Pengerjaan

Kerjakan soal-soal berikut secara mandiri. Gunakan materi bacaan sebagai referensi, tetapi usahakan menjawab dari pemahaman Anda sendiri. Periksa jawaban di bagian Kunci Jawaban setelah selesai.

## Bagian A — Soal Pilihan Ganda (Tingkat C1-C2)

**Soal 1:** Manakah pernyataan berikut yang paling tepat menggambarkan konsep **{topic}**?

- A. Suatu metode yang hanya berlaku untuk dataset kecil
- B. Pendekatan terstruktur yang mengoptimalkan efisiensi dan skalabilitas sistem ✓
- C. Teknik yang mengabaikan kompleksitas ruang demi kecepatan
- D. Prosedur yang hanya digunakan dalam sistem berbasis AI

> **Pembahasan:** Jawaban B benar. {topic} secara definisi adalah pendekatan terstruktur yang mempertimbangkan baik efisiensi waktu maupun skalabilitas.

---

**Soal 2:** Apa kompleksitas waktu terbaik yang mungkin dicapai oleh implementasi {topic} yang optimal?

- A. O(n²)
- B. O(n log n) ✓
- C. O(2ⁿ)
- D. O(n!)

> **Pembahasan:** Implementasi optimal {topic} umumnya mencapai O(n log n) dengan strategi divide and conquer.

## Bagian B — Soal Esai Singkat (Tingkat C3-C4)

**Soal 3:** Jelaskan perbedaan mendasar antara pendekatan {topic} dengan pendekatan konvensional! Sertakan minimal 3 dimensi perbandingan yang konkret.

**Panduan Jawaban:**
- Dimensi kompleksitas waktu (efisiensi komputasi)
- Dimensi konsumsi memori (efisiensi resource)
- Dimensi skalabilitas (kemampuan menangani pertumbuhan data)

**Soal 4:** Berikan contoh nyata penggunaan {topic} di industri teknologi Indonesia dan jelaskan dampaknya terhadap bisnis!

## Bagian C — Soal Analisis Kasus (Tingkat C5-C6)

**Soal 5:** Sebuah startup fintech memiliki database 10 juta transaksi harian. Tim engineering menghadapi bottleneck performa pada query analitik yang memakan waktu rata-rata 8 detik per request.

Analisis: Bagaimana penerapan prinsip {topic} dapat mengatasi masalah ini? Jelaskan langkah-langkah solusi secara detail!

**Panduan Jawaban:**
1. Identifikasi akar masalah (indeksasi, query optimization)
2. Terapkan prinsip {topic} pada layer database
3. Estimasi peningkatan performa yang bisa dicapai
4. Pertimbangkan trade-off implementasi

## Kunci Jawaban

| Soal | Jawaban | Skor Maksimal |
|---|---|---|
| Soal 1 | B | 10 poin |
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
