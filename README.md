# Automotive Part Master Data Management System (APMS)

## Deskripsi
Sistem untuk mengelola inquiry, pengecekan, validasi, approval, dan registrasi master data spare part kendaraan.

## Struktur Proyek
```
APMMS/
├── backend/          # Backend Node.js + Express + PostgreSQL
├── frontend/         # Frontend React + Vite
└── README.md
```

## Langkah Instalasi

### 1. Database PostgreSQL
Buat database baru dan jalankan schema.sql:
```bash
psql -U postgres -d postgres -f backend/schema.sql
```

### 2. Backend
```bash
cd backend
npm install
npm run dev
```

Update file `.env` dengan kredensial database Anda.

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

## Fitur Utama
- Inquiry Management
- Master Item Management
- New Item Request
- Data Validation
- Approval Management
- Reporting

## Alur Utama
```
Input Inquiry → Cek Master Item → Item Terdaftar? → YES: Lanjut Proses; NO: New Item Request → Validasi Data → Approval → Create Master Item
```
