# Ringkasan Teknis Proyek Belajara (Pembaruan Codebase Saat Ini)

Dokumen ini berisi rangkuman teknis terbaru platform **Belajara** untuk mendukung pemutakhiran dokumen Laporan Capstone Project. Seluruh informasi di bawah ini disesuaikan dengan arsitektur, basis data, dan alur kerja aktual di dalam codebase saat ini.

---

## 1. Identitas Proyek & Anggota Tim
* **Nama Platform**: Belajara
* **Deskripsi**: Platform Pembelajaran Interaktif Berbasis AI dengan Sistem Rekomendasi Mata Kuliah untuk Mahasiswa Indonesia.
* **Anggota Kelompok**:
  1. Markus Prap Kurniawan (NIM: 048397016)
  2. I Made Surya Dewata (NIM: 049649884)
  3. Desra Yudi (NIM: 050544194)
  4. Shabirah Apriani (NIM: 055093992)
* **Program Studi**: Sistem Informasi, Universitas Terbuka

---

## 2. Arsitektur Teknologi (Tech Stack)
* **Frontend**: Next.js 15+ (React) dengan TypeScript, Vanilla CSS (Custom styling), TailwindCSS (opsional/terbatas), dan Shadcn/ui (UI/UX standards berbasis Qurtuba/Ethical Minimalism).
* **Backend API**: Django 5.x dan Django REST Framework (DRF) berbasis Python 3.12+.
* **Database Utama**: PostgreSQL (Relational Database) untuk data transaksional dan profil akademik.
* **Caching & Message Broker**: Redis 7.x (alpine).
* **Antrian Task Asinkron**: Celery Workers dengan Redis Broker untuk pemrosesan file PDF/Excel kurikulum dan integrasi LLM eksternal.
* **Autentikasi**: Stateless JWT menggunakan package `djangorestframework-simplejwt`. Token disimpan secara aman dalam HttpOnly cookies di sisi produksi.
* **Media & File Storage**: Django FileField dikonfigurasi untuk local storage (atau S3 di production) untuk menyimpan file PDF kurikulum dan transkrip nilai.
* **Payment Gateway**: Midtrans Sandbox (Snap API) terintegrasi secara asinkron dengan webhook handlers.

---

## 3. Skema Basis Data Aktual (Entity Relationship Diagram - ERD)

Berikut adalah struktur tabel basis data aktual yang diimplementasikan melalui Django ORM:

### A. Aplikasi `users` (Manajemen Pengguna & Kredit)
1. **`User` (Tabel `users_user` - Warisan `AbstractUser`)**
   * `id` (PK, AutoField)
   * `username` (CharField, Unique)
   * `email` (EmailField)
   * `password` (CharField)
   * `first_name` (CharField)
   * `last_name` (CharField)
   * `is_mahasiswa` (BooleanField, Default=False)
   * `is_instructor` (BooleanField, Default=False)
   * `is_premium` (BooleanField, Default=False)
   * `is_onboarded` (BooleanField, Default=True)
   * `date_joined` (DateTimeField)
2. **`Mahasiswa` (Tabel `users_mahasiswa`)**
   * `id` (PK, AutoField)
   * `user` (OneToOneField ke `User`, on_delete=CASCADE, related_name='mahasiswa_profile')
   * `nim` (CharField, Unique)
   * `jurusan` (CharField)
   * `universitas` (CharField)
   * `semester` (IntegerField, Default=1)
   * `active_courses` (ManyToManyField ke `courses.Course`, related_name='students')
3. **`InstructorProfile` (Tabel `users_instructorprofile`)**
   * `id` (PK, AutoField)
   * `user` (OneToOneField ke `User`, on_delete=CASCADE, related_name='instructor_profile')
   * `nidn` (CharField, Unique)
   * `bidang_keahlian` (CharField)
   * `universitas` (CharField)
   * `ai_credits` (IntegerField, Default=20)
4. **`AICreditTransaction` (Tabel `users_aicredittransaction`)**
   * `id` (PK, AutoField)
   * `instructor` (ForeignKey ke `InstructorProfile`, on_delete=CASCADE)
   * `amount` (IntegerField, positif untuk top-up, negatif untuk konsumsi pembuatan modul/kuis AI)
   * `description` (CharField)
   * `created_at` (DateTimeField)
   * `reference_id` (CharField, Nullable - menunjuk order_id transaksi)

### B. Aplikasi `courses` (Manajemen Pembelajaran)
5. **`Course` (Tabel `courses_course`)**
   * `id` (PK, AutoField)
   * `code` (CharField, Unique)
   * `title` (CharField)
   * `description` (TextField)
   * `sks` (IntegerField, Default=3)
   * `semester` (IntegerField, Default=1)
   * `department` (CharField)
   * `price` (DecimalField, max_digits=10, decimal_places=2, Default=0.00)
   * `is_premium` (BooleanField, Default=False)
   * `category` (CharField, Default='IT & Software')
   * `instructor_name` (CharField)
   * `instructor_email` (CharField)
   * `thumbnail_url` (CharField, Nullable)
   * `status` (CharField, Default='public')
   * `tags` (CharField, Blank=True)
   * `level` (CharField, Default='beginner')
6. **`CourseModule` (Tabel `courses_coursemodule`)**
   * `id` (PK, AutoField)
   * `course` (ForeignKey ke `Course`, on_delete=CASCADE, related_name='modules')
   * `title` (CharField)
   * `description` (TextField)
   * `order` (IntegerField, Default=1)
7. **`SubChapter` (Tabel `courses_subchapter`)**
   * `id` (PK, AutoField)
   * `module` (ForeignKey ke `CourseModule`, on_delete=CASCADE, related_name='subchapters')
   * `title` (CharField)
   * `type` (CharField, Choices: `video`, `reading`, `quiz`, `forum`)
   * `order` (IntegerField, Default=1)
   * `video_url` (URLField, Nullable)
   * `content` (TextField, Nullable - menampung materi berbasis Markdown)
   * `duration` (CharField, Default='15 mnt')
8. **`Enrollment` (Tabel `courses_enrollment`)**
   * `id` (PK, AutoField)
   * `mahasiswa` (ForeignKey ke `Mahasiswa`, on_delete=CASCADE, related_name='enrollments')
   * `course` (ForeignKey ke `Course`, on_delete=CASCADE, related_name='enrollments')
   * `enrolled_at` (DateTimeField)
   * `mode` (CharField, Choices: `audit`, `verified`, Default='audit')
   * `status` (CharField, Choices: `active`, `completed`, Default='active')
   * *Relasi Unik*: (`mahasiswa`, `course`)
9. **`Certificate` (Tabel `courses_certificate`)**
   * `id` (PK, AutoField)
   * `mahasiswa` (ForeignKey ke `Mahasiswa`, on_delete=CASCADE)
   * `course` (ForeignKey ke `Course`, on_delete=CASCADE)
   * `certificate_id` (CharField, Unique)
   * `issued_at` (DateTimeField)

### C. Aplikasi `quizzes` (Manajemen Evaluasi)
10. **`Quiz` (Tabel `quizzes_quiz`)**
    * `id` (PK, AutoField)
    * `module` (ForeignKey ke `CourseModule`, on_delete=CASCADE, related_name='quizzes')
    * `questions_json` (JSONField - menyimpan daftar soal pilihan ganda, opsi, kunci, dan penjelasan)
    * `generated_by_ai` (BooleanField, Default=False)
    * `created_at` (DateTimeField)
11. **`QuizSubmission` (Tabel `quizzes_quizsubmission`)**
    * `id` (PK, AutoField)
    * `mahasiswa` (ForeignKey ke `Mahasiswa`, on_delete=CASCADE)
    * `quiz` (ForeignKey ke `Quiz`, on_delete=CASCADE)
    * `answers_json` (JSONField - menyimpan jawaban mahasiswa per indeks soal)
    * `score` (FloatField, Default=0.0)
    * `passed` (BooleanField, Default=False)
    * `graded_at` (DateTimeField)

### D. Aplikasi `explore` (Rekomendasi AI)
12. **`Curriculum` (Tabel `explore_curriculum`)**
    * `id` (PK, AutoField)
    * `user` (ForeignKey ke `User`, on_delete=CASCADE, related_name='curricula')
    * `file_name` (CharField)
    * `file_url` (FileField uploading to `curricula/`)
    * `uploaded_at` (DateTimeField)
13. **`AIRecommendation` (Tabel `explore_airecommendation`)**
    * `id` (PK, AutoField)
    * `mahasiswa` (ForeignKey ke `Mahasiswa`, on_delete=CASCADE, related_name='ai_recommendations')
    * `curriculum` (ForeignKey ke `Curriculum`, on_delete=SET_NULL, Nullable)
    * `recommendations_data` (JSONField - menyimpan struktur rekomendasi: data gap kompetensi, mata kuliah yang direkomendasikan, persentase kecocokan, dan detail rekomendasi karir)
    * `created_at` (DateTimeField)

### E. Aplikasi `discussions` (Forum Diskusi Kelas)
14. **`DiscussionPost` (Tabel `discussions_discussionpost`)**
    * `id` (PK, AutoField)
    * `course` (ForeignKey ke `Course`, on_delete=CASCADE, related_name='discussions')
    * `user` (ForeignKey ke `User`, on_delete=CASCADE)
    * `content` (TextField)
    * `parent` (ForeignKey ke `self`, on_delete=CASCADE, Nullable, related_name='replies')
    * `created_at` (DateTimeField)

### F. Aplikasi `payments` (Langganan & Pembayaran Midtrans)
15. **`Subscription` (Tabel `payments_subscription`)**
    * `id` (PK, AutoField)
    * `mahasiswa` (OneToOneField ke `Mahasiswa`, on_delete=CASCADE, related_name='subscription')
    * `tier` (CharField, Choices: `scholar` [49k/bln], `pro` [99k/bln])
    * `status` (CharField, Choices: `active`, `suspended`, `cancelled`, `expired`, Default='active')
    * `saved_token_id` (CharField, Blank=True)
    * `current_period_start` (DateTimeField)
    * `current_period_end` (DateTimeField)
    * `created_at` (DateTimeField)
    * `updated_at` (DateTimeField)
    * `cancelled_at` (DateTimeField, Nullable)
16. **`Transaction` (Tabel `payments_transaction`)**
    * `id` (PK, AutoField)
    * `order_id` (CharField, Unique)
    * `mahasiswa` (ForeignKey ke `Mahasiswa`, on_delete=CASCADE, Nullable)
    * `instructor` (ForeignKey ke `InstructorProfile`, on_delete=CASCADE, Nullable)
    * `course` (ForeignKey ke `Course`, on_delete=CASCADE, Nullable)
    * `subscription` (ForeignKey ke `Subscription`, on_delete=models.SET_NULL, Nullable)
    * `transaction_type` (CharField, Choices: `course_purchase`, `subscription_new`, `subscription_renewal`, `credit_purchase`)
    * `amount` (DecimalField)
    * `snap_token` (CharField, Nullable)
    * `snap_url` (CharField, Nullable)
    * `status` (CharField, Choices: `pending`, `success`, `failed`, `expire`, `cancel`, Default='pending')
    * `midtrans_payload` (JSONField, Nullable)
    * `created_at` (DateTimeField)
    * `updated_at` (DateTimeField)

---

## 4. Alur Kerja Fitur AI Rekomendasi Mata Kuliah
Proses analisis dan rekomendasi mata kuliah berjalan secara asinkron menggunakan **Celery** dan **Google Gemini API** (dengan fallback pencocokan berbasis token teks):
1. **Unggah Berkas**: Mahasiswa mengunggah transkrip akademik (PDF) dan kurikulum program studi (PDF atau Excel) melalui modul antarmuka eksplorasi.
2. **Delegasi Antrian**: Django API menerima berkas tersebut, menyimpannya, lalu mengirimkan parameter ID ke antrian Celery (`analyze_curriculum_task`) dengan broker Redis.
3. **Ekstraksi Teks**: Worker mengekstrak teks menggunakan parser PDF (`PyPDF2`/`pdfplumber`) atau parser Excel (`openpyxl`).
4. **Analisis LLM (Gemini)**: Teks kurikulum, transkrip nilai, dan daftar mata kuliah yang tersedia di database dikirim ke model Gemini API. Model menganalisis kekuatan akademik mahasiswa, mengidentifikasi *competency gaps* (baik wajib maupun pilihan), memberikan rekomendasi karir, serta menyusun rencana semester yang disarankan.
5. **Normalisasi & Pemfilteran**:
   * Sistem melakukan pemfilteran regex untuk memastikan riwayat mata kuliah yang diselesaikan (*completed subjects*) benar-benar tertulis di berkas asli guna mencegah halusinasi AI.
   * Dilakukan pengecekan kode kelas di database untuk memastikan mata kuliah yang direkomendasikan benar-benar terdaftar di platform Belajara.
6. **Premium Gating**:
   * **Pengguna Free**: Hanya mendapatkan maksimal 3 rekomendasi mata kuliah, maksimal 2 bukti kompetensi (teaser), hanya informasi gap wajib (tanpa gap pilihan/karir), dan rencana semester disembunyikan.
   * **Pengguna Premium**: Mendapatkan visualisasi penuh analisis profil akademik, seluruh gap kompetensi, peta karir lengkap, dan rekomendasi rencana semester terstruktur.
7. **Penyimpanan & Visualisasi**: Hasil JSON disimpan di tabel `AIRecommendation` dan dirender secara real-time pada dashboard mahasiswa.

---

## 5. Integrasi Pembayaran Midtrans & Freemium
Belajara menerapkan model bisnis Freemium yang diotomatiskan dengan Midtrans Snap API:
* **Per-Course Purchase**: Mahasiswa mendaftar kelas berbayar (Premium) secara individual. Transaksi bertipe `course_purchase` dibuat, memicu tautan bayar Midtrans Snap. Setelah pembayaran berhasil (settlement webhook), status pendaftaran berubah menjadi `verified`.
* **Subscription Tiers**: Mahasiswa dapat berlangganan tier **Scholar** atau **Pro** untuk mengakses kelas premium secara tak terbatas dan memperoleh rekomendasi AI lengkap. Midtrans webhook menangani siklus pembatalan (`cancelled`), jatuh tempo (`expired`), atau kegagalan pembayaran (`suspended`).
* **Instructor AI Credits**: Pengajar/Dosen harus menggunakan `ai_credits` untuk melakukan auto-generasi kuis/materi ajar lewat AI (mengurangi saldo kredit). Kredit tambahan dapat dibeli via transaksi `credit_purchase` yang terintegrasi dengan payment gateway.

---

## 6. Fitur Manajemen Kelas Pengajar (Termasuk Penghapusan Kelas)
* **CRUD Kelas & Modul**: Dosen memiliki kontrol penuh untuk membuat, memperbarui, dan menghapus kelas, modul, dan sub-bab materi.
* **Fitur Penghapusan Kelas (Delete Course)**:
  * Dilindungi oleh **ownership verification** di backend: Hanya dosen pembuat kelas (memiliki kecocokan `instructor_email` dengan `request.user.email`) yang dapat menghapus kelas tersebut.
  * Menerapkan **cascade deletion** di basis data: Menghapus data kelas akan secara otomatis melenyapkan data modul, materi sub-bab, kuis terkait, entri pendaftaran mahasiswa, forum diskusi kelas, dan sertifikat yang diterbitkan untuk kelas tersebut secara bersih.
  * Dilengkapi **Double Confirmation Dialog** di frontend: Dosen harus memasukkan kode kelas secara manual (misal: `IF-301`) sebelum tombol "Hapus Permanen" dapat ditekan untuk mencegah kesalahan penghapusan tidak disengaja.

---
---

# PROMPT CLAUDE: Pembaruan Laporan Capstone Project

Salin seluruh teks prompt di bawah ini, lalu tempelkan ke Claude bersama dengan file `Laporan_Capstone_Project_Full.txt` untuk memperbarui dokumen laporan Anda:

```text
Anda adalah seorang analis sistem, penulis akademik, dan pakar penulisan Laporan Capstone Project Sistem Informasi. 

Saya akan memberikan dokumen draf Laporan Capstone Project saya saat ini yang bernama "Laporan_Capstone_Project_Full.txt" dan data ringkasan teknis terbaru dari codebase rilisan aktual proyek "Belajara" dalam bentuk markdown di atas.

Tugas Anda adalah:
1. Perbarui, revisi, dan lengkapi Bab III (khususnya sub-bab Arsitektur Teknologi, Desain Skema Database/ERD, dan Alur Kerja Fitur Rekomendasi) agar sepenuhnya sinkron dengan data ringkasan teknis codebase aktual Belajara yang saya berikan.
2. Pada bagian Desain Database (Table 4 di draf sebelumnya), hapus skema basis data lama yang sangat sederhana dan ganti dengan skema ERD aktual yang baru (mencakup 16 tabel yang dikelompokkan berdasarkan modul aplikasinya: users, courses, quizzes, explore, discussions, dan payments). Jabarkan kolom-kolom utama, tipe data, dan relasi antar tabel (OneToOne, ForeignKey, ManyToMany) secara detail dan akademis.
3. Tambahkan penjelasan mengenai penanganan relasi cascade deletion dan verifikasi kepemilikan (ownership check) pada manajemen kelas dosen untuk menunjukkan aspek keamanan dan integritas data sistem informasi yang matang.
4. Perbarui Tabel Perbandingan Fitur Platform Sejenis (Tabel 1) di Bab II dan deskripsi teknologi (Tabel 2) agar mencakup pemakaian Next.js, Celery, Redis, dan Midtrans secara konsisten.
5. Tuliskan revisi ini dalam Bahasa Indonesia yang sangat formal, rapi, bernada akademik universitas, mempertahankan struktur penomoran bab yang sudah ada, serta menjaga data orisinal kelompok kami yang tercantum di bagian Pendahuluan dan Lampiran.

Harap hasilkan output revisi dokumen Laporan Capstone Project yang lengkap, rapi, dan siap digunakan.
```
