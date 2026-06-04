# Dokumentasi Fitur: Pratinjau Mata Kuliah (Course Preview)

Fitur **Course Preview** memungkinkan mahasiswa (dan tamu) untuk melihat informasi lengkap dari suatu mata kuliah di katalog sebelum melakukan pendaftaran (enrollment).

## 1. Navigasi & Alur Pengguna (User Flow)
1. Pengguna membuka halaman **Katalog Kelas** (`/catalog`).
2. Pengguna mengklik judul kartu kelas atau tautan **Detail & Preview** pada mata kuliah pilihan.
3. Pengguna diarahkan ke halaman pratinjau kelas (`/catalog/preview/[code]`).
4. Pengguna dapat mengeksplorasi silabus, deskripsi kelas, alat yang digunakan, dan ulasan mahasiswa.
5. Pengguna mengklik **Enrol Now** untuk memilih tipe pendaftaran (Audit Gratis vs Kelas Lengkap Premium).
6. Tombol tutup (**X**) di kanan atas akan mengembalikan pengguna kembali ke katalog.

## 2. Struktur Tampilan (Layout & UI)
Desain halaman pratinjau ini mengikuti standar **Ethical Minimalism (Qurtuba Style)** dengan tata letak dua kolom:
- **Kolom Kiri (Sidebar / Informasi Singkat)**:
  - **Video Thumbnail**: Gambar pratinjau dengan overlay tombol putar. Mengklik tombol ini akan membuka pemutar video preview di dalam modal overlay.
  - **Pricing Box**: Informasi harga kelas, lengkap dengan harga asli yang dicoret dan penanda kupon untuk kelas berbayar.
  - **Action Button**: Tombol "Enrol Now" (dengan efek gradasi), tombol bagikan tautan, dan tombol wishlist (ikon hati).
  - **Instructor Card**: Profil pengajar (nama, gelar, email, dan deskripsi singkat).
  - **Course Detail**: Informasi statistik kelas (Rating, jumlah Modul, jumlah Tugas, jumlah Kuis, dan tanggal pembaruan terakhir).
  - **Tools List**: Daftar perkakas/alat yang akan digunakan dalam pembelajaran (disesuaikan berdasarkan kategori kelas, e.g. Figma untuk desain, VS Code untuk informatika).
  - **Benefits**: Manfaat kelulusan kelas.
- **Kolom Kanan (Konten Utama)**:
  - **Metadata Header**: Kategori/jurusan, judul mata kuliah, kode, SKS, dan semester.
  - **About Section**: Deskripsi lengkap kelas dengan tombol *read-more* ekspansi.
  - **Tabs Menu**:
    - **Course Info**: Berisi daftar "What you'll learn" dan penjelasan sertifikat kelulusan beserta grafis mockup sertifikat kelulusan.
    - **Course Outline (Syllabus)**: Daftar modul yang dapat diekspansi secara interaktif (accordion) untuk melihat sub-bab di dalamnya.
    - **Resources**: Sumber daya/file unduhan penunjang materi.
    - **Reviews**: Testimoni dan rating mahasiswa.

## 3. Integrasi API & Pembayaran
Halaman pratinjau memanfaatkan endpoint API Django:
- `GET /api/courses/[code]/` untuk mengambil detail silabus dan pengajar.
- `POST /api/courses/enroll/` untuk mendaftar kelas dalam mode Audit.
- `/payments/checkout/` dan `/payments/verify/` untuk integrasi simulasi gerbang pembayaran Midtrans Snap.
- Sistem fallback otomatis (di dalam `src/lib/api.ts`) memastikan halaman pratinjau tetap menampilkan data fiktif (mock) yang lengkap apabila koneksi API lokal terputus.

## 4. Tipografi & Desain Sistem
Typography yang digunakan diselaraskan dengan instruksi `GEMINI.md`:
- **Heading**: Menggunakan Google Fonts *Playfair Display* (Serif) untuk kesan elegan.
- **Body**: Menggunakan Google Fonts *Montserrat* (Sans-serif) untuk keterbacaan tingkat tinggi.
- **Colors**:
  - Background: Soft Off-White (`#FAF9FB`)
  - Primary: Deep Charcoal (`#060708`)
  - Accent 1: Muted Mauve (`#C6B5BF`)
  - Accent 2: Vibrant Red (`#CF3A1F`)
