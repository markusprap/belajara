---
title: Belajara Backend
emoji: 🎓
colorFrom: purple
colorTo: indigo
sdk: docker
app_port: 7860
---

# Belajara

Platform Pembelajaran Interaktif Berbasis AI dengan Sistem Rekomendasi Mata Kuliah untuk Mahasiswa Indonesia.

## Tech Stack
- **Frontend**: Next.js (React), Tailwind CSS, shadcn/ui.
- **Backend**: Django 5.x (REST Framework).
- **Database**: PostgreSQL.
- **Cache/Queue**: Redis + Celery.

## Arsitektur
Proyek ini menggunakan arsitektur *decoupled*:
- `belajara_frontend`: Aplikasi Next.js (port `3000`).
- `belajara_backend`: API Django (port `8001`).

## Standar Desain
"Ethical Minimalism" (Qurtuba Style)
- Background: `#FAF9FB`
- Primary: `#060708`
- Accent 1: `#C6B5BF`
- Accent 2: `#CF3A1F`

## Setup & Panduan Menjalankan Aplikasi

### 1. Prasyarat (Prerequisites)
Pastikan Anda sudah menginstal:
- Docker & Docker Compose
- Python 3.12+
- Node.js 18+

### 2. Konfigurasi Environment (`.env`)
Salin file `.env.example` ke `.env` di root folder dan sesuaikan variabelnya:
```bash
cp .env.example .env
```

### 3. Jalankan Database & Redis (Docker)
Jalankan kontainer PostgreSQL dan Redis di latar belakang:
```bash
docker compose up -d
```
*Port PostgreSQL: `54321`*
*Port Redis: `6379`*

### 4. Setup & Jalankan Backend (Django)
Masuk ke direktori backend, buat virtual environment, instal dependensi, jalankan migrasi database, dan jalankan server pengembangan:
```bash
cd belajara_backend
python -m venv .venv
source .venv/bin/activate  # Untuk Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8001
```

### 5. Jalankan Celery & Celery Beat
Celery digunakan untuk memproses analisis dokumen secara asynchronous, dan Celery Beat digunakan untuk tugas periodik (pembersihan data kurikulum lama setiap jam 2 pagi).
Dalam virtual environment yang aktif:
```bash
# Terminal 1: Jalankan worker
celery -A belajara_backend worker --loglevel=info

# Terminal 2: Jalankan scheduler (Beat)
celery -A belajara_backend beat --loglevel=info
```

### 6. Setup & Jalankan Frontend (Next.js)
Masuk ke direktori frontend, instal dependensi, dan jalankan server pengembangan:
```bash
cd belajara_frontend
npm install
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di peramban Anda.

### 7. Menjalankan Tes (Testing)
Untuk memastikan seluruh modul backend berfungsi dengan benar, jalankan suite pengujian menggunakan Pytest:
```bash
cd belajara_backend
pytest
```
