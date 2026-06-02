# Task 02: Django Backend Setup

**Agent**: AGENT_BACKEND_CORE & AGENT_MODELS
**Status**: Pending

## Deskripsi
Inisialisasi proyek Django 5.x untuk bertindak sebagai API server (REST) dengan arsitektur *Service Layer*.

## Requirements
1. Setup virtual environment `.venv` dan install `django`, `djangorestframework`, `psycopg`, `redis`, `python-dotenv`, `pytest-django`.
2. Inisialisasi project: `django-admin startproject belajara_backend .`
3. Konfigurasi `settings.py`:
   - Setup `DATABASES` menggunakan variabel lingkungan (PostgreSQL).
   - Setup `CACHES` menggunakan Redis.
   - Konfigurasi DRF dasar.
4. Buat app `users` dan setup Custom User Model (`User` dan profil `Mahasiswa`).
5. Inisialisasi struktur folder untuk *Service Layer pattern* di dalam tiap app (misal: `services.py`, `selectors.py`).
6. Siapkan pytest dasar.
