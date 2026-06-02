# Task 01: Docker Setup

**Agent**: AGENT_MODELS
**Status**: Pending

## Deskripsi
Siapkan konfigurasi Docker Compose untuk menjalankan PostgreSQL dan Redis secara lokal. 

## Requirements
1. Buat file `docker-compose.yml` di root directory.
2. Service `db`:
   - Image: `postgres:15-alpine`
   - Port: `5432:5432`
   - Environment variables (POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD).
   - Volume: `postgres_data`.
3. Service `redis`:
   - Image: `redis:7-alpine`
   - Port: `6379:6379`
   - Volume: `redis_data`.
4. Buat `.env` sample di root (`.env.example`).
