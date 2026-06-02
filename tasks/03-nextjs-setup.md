# Task 03: Next.js Frontend Setup

**Agent**: AGENT_FRONTEND
**Status**: Pending

## Deskripsi
Inisialisasi proyek Next.js dengan arsitektur UI/UX "Ethical Minimalism" (Qurtuba Style) dan shadcn/ui.

## Requirements
1. Inisialisasi project: `npx create-next-app@latest belajara_frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
2. Masuk ke direktori `belajara_frontend`.
3. Inisialisasi shadcn/ui: `npx shadcn-ui@latest init` (menggunakan referensi warna netral).
4. Konfigurasi `globals.css` untuk Qurtuba Palette:
   - Background: `#FAF9FB`
   - Primary: `#060708`
   - Accent 1 (Muted Mauve): `#C6B5BF`
   - Accent 2 (Vibrant Red): `#CF3A1F`
5. Konfigurasi tipografi:
   - Menggunakan Google Fonts `Playfair Display` untuk *headings*.
   - Menggunakan Google Fonts `Geist` (atau `Montserrat`) untuk *body*.
6. Buat halaman dasar untuk **Dashboard Mahasiswa** (modular card-based) sesuai panduan shadcn/ui Dashboard Example.
