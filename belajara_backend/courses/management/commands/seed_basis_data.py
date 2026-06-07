from django.core.management.base import BaseCommand
from courses.models import Course, CourseModule, SubChapter
from django.contrib.auth import get_user_model
from users.models import Mahasiswa

class Command(BaseCommand):
    help = "Seeds a detailed 'Basis Data' course with complete module and subchapter content"

    def handle(self, *args, **options):
        YOUTUBE_URL = "https://www.youtube.com/watch?v=HXV3zeQKqGY"
        self.stdout.write(self.style.MIGRATE_HEADING("=== Seeding Mata Kuliah: Basis Data ==="))

        # ── 1. Create / update the Course ────────────────────────────────────────
        course, created = Course.objects.update_or_create(
            code="IF201",
            defaults={
                "title": "Basis Data",
                "description": (
                    "Mata kuliah ini memberikan pemahaman mendalam tentang prinsip-prinsip sistem "
                    "manajemen basis data (DBMS). Mahasiswa akan mempelajari pemodelan data "
                    "menggunakan ER-Diagram, bahasa kueri terstruktur (SQL), proses normalisasi "
                    "untuk optimasi skema, manajemen transaksi, hingga konsep NoSQL. "
                    "Kurikulum dirancang agar mahasiswa mampu merancang dan mengelola database "
                    "skala enterprise yang efisien dan aman."
                ),
                "sks": 4,
                "semester": 3,
                "department": "Informatika",
                "price": 349000.00,
                "is_premium": True,
                "category": "IT & Software",
                "instructor_name": "Dr. Ir. Rina Wijaya, MT",
                "instructor_email": "rina.wijaya@belajara.id",
                "thumbnail_url": "/images/basis_data_thumbnail.png",
                "status": "public",
                "tags": "database,sql,postgresql,normalization,erd,nosql",
                "level": "beginner",
            },
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"  [+] Course created: {course}"))
        else:
            self.stdout.write(self.style.WARNING(f"  [~] Course updated: {course}"))

        # ── 2. Define Modules + SubChapters ──────────────────────────────────────
        modules_data = [
            {
                "order": 1,
                "title": "Pengenalan Basis Data & Pemodelan ERD",
                "description": "Konsep dasar DBMS, sejarah, dan teknik perancangan database menggunakan Entity-Relationship Diagram.",
                "subchapters": [
                    {
                        "order": 0,
                        "title": "Video: Apa itu Database & Mengapa Kita Butuh DBMS?",
                        "type": "video",
                        "duration": "15 mnt",
                        "video_url": YOUTUBE_URL,
                        "content": "# Pengenalan Database\n\nTonton video ini untuk memahami perbedaan antara spreadsheet biasa dengan Database Management System (DBMS).",
                    },
                    {
                        "order": 1,
                        "title": "Konsep Dasar & Arsitektur DBMS",
                        "type": "reading",
                        "duration": "20 mnt",
                        "content": """# Konsep Dasar & Arsitektur DBMS

## Apa itu DBMS?
**Database Management System (DBMS)** adalah perangkat lunak yang berinteraksi dengan pengguna akhir, aplikasi, dan database itu sendiri untuk menangkap dan menganalisis data.

## Keuntungan Menggunakan DBMS
1. **Redundansi Data Minimal**: Menghindari duplikasi data yang tidak perlu.
2. **Konsistensi Data**: Memastikan data akurat di seluruh sistem.
3. **Keamanan**: Kontrol akses yang ketat terhadap siapa yang boleh melihat/mengubah data.
4. **Integritas**: Memastikan data mematuhi aturan tertentu (misal: umur tidak boleh negatif).

## Arsitektur 3-Level (ANSI/SPARC)
- **External Level (View)**: Apa yang dilihat oleh user (UI).
- **Conceptual Level (Logical)**: Struktur data secara keseluruhan (Tabel, Relasi).
- **Internal Level (Physical)**: Bagaimana data disimpan di disk (Byte, Index).
""",
                    },
                    {
                        "order": 2,
                        "title": "Entity-Relationship Diagram (ERD)",
                        "type": "reading",
                        "duration": "25 mnt",
                        "content": """# Entity-Relationship Diagram (ERD)

ERD adalah representasi grafis dari struktur logis basis data.

## Komponen Utama
1. **Entity (Entitas)**: Objek di dunia nyata (contoh: Mahasiswa, Mata Kuliah). Disimbolkan dengan **Persegi Panjang**.
2. **Attribute (Atribut)**: Properti dari entitas (contoh: Nama, NIM). Disimbolkan dengan **Elips**.
3. **Relationship (Relasi)**: Hubungan antar entitas (contoh: Mahasiswa *mengambil* Mata Kuliah). Disimbolkan dengan **Belah Ketupat**.

## Cardinality (Kardinalitas)
- **1:1 (One-to-One)**: Satu dosen mengepalai satu jurusan.
- **1:N (One-to-Many)**: Satu dosen mengajar banyak kelas.
- **M:N (Many-to-Many)**: Banyak mahasiswa mengambil banyak mata kuliah.
""",
                    },
                ]
            },
            {
                "order": 2,
                "title": "SQL Dasar: DDL & DML",
                "description": "Belajar bahasa standar untuk berinteraksi dengan database relasional.",
                "subchapters": [
                    {
                        "order": 0,
                        "title": "Video: Live Coding SQL Dasar",
                        "type": "video",
                        "duration": "20 mnt",
                        "video_url": YOUTUBE_URL,
                        "content": "# Live Coding SQL\n\nMari kita praktek membuat tabel pertama kita menggunakan PostgreSQL.",
                    },
                    {
                        "order": 1,
                        "title": "Data Definition Language (DDL)",
                        "type": "reading",
                        "duration": "15 mnt",
                        "content": """# Data Definition Language (DDL)

Digunakan untuk mendefinisikan struktur database.

```sql
-- Membuat Database
CREATE DATABASE belajara_db;

-- Membuat Tabel
CREATE TABLE mahasiswa (
    id SERIAL PRIMARY KEY,
    nim VARCHAR(10) UNIQUE NOT NULL,
    nama VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    tanggal_lahir DATE
);

-- Mengubah Struktur
ALTER TABLE mahasiswa ADD COLUMN jurusan VARCHAR(50);

-- Menghapus Tabel
DROP TABLE mahasiswa;
```
""",
                    },
                    {
                        "order": 2,
                        "title": "Data Manipulation Language (DML)",
                        "type": "reading",
                        "duration": "25 mnt",
                        "content": """# Data Manipulation Language (DML)

Digunakan untuk mengelola data di dalam tabel.

### INSERT (Menambah Data)
```sql
INSERT INTO mahasiswa (nim, nama, email)
VALUES ('220101', 'Budi Santoso', 'budi@mail.com');
```

### SELECT (Mengambil Data)
```sql
SELECT nama, email FROM mahasiswa WHERE jurusan = 'Informatika';
```

### UPDATE (Mengubah Data)
```sql
UPDATE mahasiswa SET email = 'budi_baru@mail.com' WHERE nim = '220101';
```

### DELETE (Menghapus Data)
```sql
DELETE FROM mahasiswa WHERE nim = '220101';
```
""",
                    },
                ]
            },
            {
                "order": 3,
                "title": "Normalisasi Basis Data",
                "description": "Proses mengorganisir data untuk mengurangi redundansi dan meningkatkan integritas.",
                "subchapters": [
                    {
                        "order": 0,
                        "title": "Apa itu Anomali & Redundansi?",
                        "type": "reading",
                        "duration": "15 mnt",
                        "content": """# Anomali & Redundansi

Tanpa normalisasi, kita akan menghadapi:
1. **Insertion Anomaly**: Tidak bisa input data tertentu karena ketergantungan data lain.
2. **Update Anomaly**: Harus ubah banyak baris untuk satu informasi yang sama.
3. **Deletion Anomaly**: Kehilangan data penting saat menghapus data lain.
""",
                    },
                    {
                        "order": 1,
                        "title": "1NF, 2NF, dan 3NF",
                        "type": "reading",
                        "duration": "30 mnt",
                        "content": """# Tahapan Normalisasi

### 1. First Normal Form (1NF)
- Tidak ada grup berulang (multi-valued attributes).
- Setiap sel harus berisi nilai atomik (tunggal).

### 2. Second Normal Form (2NF)
- Sudah memenuhi 1NF.
- Tidak ada **Partial Functional Dependency** (Atribut non-key harus bergantung pada seluruh Primary Key, bukan sebagian).

### 3. Third Normal Form (3NF)
- Sudah memenuhi 2NF.
- Tidak ada **Transitive Dependency** (Atribut non-key tidak boleh bergantung pada atribut non-key lainnya).
""",
                    },
                ]
            }
        ]

        # ── 3. Execute Seeding ───────────────────────────────────────────────────
        for m_data in modules_data:
            module, m_created = CourseModule.objects.update_or_create(
                course=course,
                order=m_data["order"],
                defaults={
                    "title": m_data["title"],
                    "description": m_data["description"],
                },
            )
            msg = "Created" if m_created else "Updated"
            self.stdout.write(f"  [{msg}] Module {module.order}: {module.title}")

            for s_data in m_data["subchapters"]:
                sub, s_created = SubChapter.objects.update_or_create(
                    module=module,
                    order=s_data["order"],
                    defaults={
                        "title": s_data["title"],
                        "type": s_data["type"],
                        "duration": s_data["duration"],
                        "video_url": s_data.get("video_url"),
                        "content": s_data.get("content"),
                    },
                )
                s_msg = "Created" if s_created else "Updated"
                self.stdout.write(f"      [{s_msg}] SubChapter {sub.order}: {sub.title} ({sub.type})")

        # ── 4. Enrollment for 'mahasiswa' ────────────────────────────────────────
        User = get_user_model()
        user = User.objects.filter(username="mahasiswa").first()
        if user:
            mahasiswa = Mahasiswa.objects.filter(user=user).first()
            if mahasiswa:
                mahasiswa.active_courses.add(course)
                self.stdout.write(self.style.SUCCESS(f"  Enrolled 'mahasiswa' into '{course.title}'"))

        self.stdout.write(self.style.SUCCESS("\n✅  Seeding selesai! Course 'Basis Data' (IF201) berhasil dibuat."))
