# KosConnect ERP (Lite)

Mini Property ERP system for rental property business operations (boarding houses/apartments). Built for **Technical Test Assessment** by **Ajis Maulana Shadiq**.

---

## 1. Konsep & Alur Bisnis (ERP Flow)

Bukan sekadar aplikasi CRUD sederhana, KosConnect ERP memetakan proses bisnis riil operasional properti:

```
[Kamar (Aset)] ──▶ [Disewa (Kontrak)] ──▶ [Terbit Tagihan (Invoicing)] ──▶ [Pembayaran (Midtrans)] ──▶ [Update Status & Jurnal] ──▶ [Notifikasi (n8n)]
```

### 3 Modul Utama
1. **Modul 1: Property & Room Management (Asset Module)**
   * Master properti & unit kamar (nomor kamar, harga bulanan, fasilitas).
   * Indikator status kamar real-time: `AVAILABLE` vs `OCCUPIED`.
2. **Modul 2: Tenant & Lease Contract (CRM Module)**
   * Data identitas penyewa (Nama, Email, WhatsApp).
   * Pembuatan kontrak sewa aktif dengan logika otomatis mengubah status kamar menjadi `OCCUPIED`.
   * Check-out / terminate contract yang secara otomatis mengembalikan kamar menjadi `AVAILABLE`.
3. **Modul 3: Billing & Payment Gateway (Financial Module)**
   * Penerbitan tagihan sewa bulanan dengan nomor invoice unik (`INV-YYYYMM-XXXX`).
   * Integrasi pembayaran digital via Midtrans Snap Sandbox.
   * Webhook callback listener dengan verifikasi `signature_key` (SHA512) untuk otomatisasi pelunasan tagihan menjadi `PAID`.
   * Integrasi **External Currency API (IDR ⇄ USD)** untuk konversi pelaporan finansial internasional secara realtime.
   * Endpoint simulasi instan (`POST /api/webhooks/simulate-payment/:invoiceId`) untuk demo reviewer tanpa akun Midtrans sandbox aktif.

### Multi-Role & Strict Separation of Concerns (Single Responsibility Principle)
Sistem memisahkan tanggung jawab setiap halaman dan peran secara ketat untuk mencegah kebocoran kapabilitas (leaky abstraction):

| Halaman | Super Admin (Platform Operator) | Pemilik Kos (Property Owner) | Penyewa (Tenant) |
| :--- | :--- | :--- | :--- |
| **`/` (Dashboard Overview)** | Monitoring KPI platform: Total Kos, Kamar terdaftar, Total GMV & Estimasi Komisi Platform. | Monitoring performa kos: Okupansi kamar, sewa aktif, pendapatan bulanan properti. | Ringkasan masa sewa aktif, informasi kamar, dan status tagihan berjalan. |
| **`/properties` (Manajemen Properti)** | Daftarkan properti mitra baru (pilih pemilik dari dropdown mitra terdaftar). | Kelola inventaris unit kamar, set harga sewa (format ribuan otomatis), & fasilitas. | Katalog info kamar dan fasilitas kos yang dihuni. |
| **`/tenants` (Direktori & CRM)** | Direktori mitra pemilik kos (+ **Daftarkan Akun Pemilik Baru**) & direktori master penyewa. | Daftarkan akun penyewa (+ **Buat Akun Penyewa Baru**), buat Kontrak Sewa, & proses Check-out. | Rincian data kontrak sewa aktif dan kontak pengelola kos. |
| **`/invoices` (Keuangan & Tagihan)** | **Audit-Only Log & Revenue Platform (2.5%)**: Memantau seluruh transaksi platform & Midtrans. *Tidak ada tombol create/pay.* | **Penerbitan Tagihan**: Terbitkan invoice sewa kamar ke penyewa, pantau status pembayaran, kirim pengingat WhatsApp. | **Pembayaran Mandiri**: Rincian invoice dan pelunasan digital via Midtrans Snap (atau Simulasi). |
| **`/portal` (Portal Penyewa)** | *Akses dialihkan ke dashboard operasional platform.* | *Akses dialihkan ke dashboard kelola kos.* | Portal mandiri sewa kamar, histori transaksi, dan pelunasan instan. |

### Enterprise Onboarding & Password Security Flow
* **Tanpa Registrasi Publik Mandiri (Closed-Loop ERP):**
  1. **Akun Pemilik Kos:** Didaftarkan secara eksklusif oleh **Super Admin** melalui halaman Direktori Mitra (`/tenants`).
  2. **Akun Penyewa Kos:** Didaftarkan oleh **Pemilik Kos** yang bersangkutan melalui halaman Penghuni (`/tenants`).
* **Satu Kali Salin (Copy Credential):**
  * Setelah akun dibuat, sistem menyajikan modal kredensial dengan tombol salin otomatis yang mencakup **Email dan Password Sementara** (`123456789`) sekaligus.
* **Wajib Ganti Password (Force Password Change on First Login):**
  * Akun baru ditandai dengan flag `mustChangePassword: true`.
  * Saat pertama kali login, modal pengaman wajib akan mengunci layar sampai pengguna:
    1. Memasukkan Password Lama (harus `123456789`).
    2. Menetapkan Password Baru yang memenuhi standar enterprise: **Minimal 8 karakter, kombinasi huruf kapital, huruf kecil, angka, dan karakter khusus/simbol**.
    3. Dilengkapi fitur *Show/Hide Password* interaktif pada setiap kolom input.

* **Mobile First Experience:**
  * Sidebar desktop otomatis bertransisi menjadi **Bottom Navigation Bar** di smartphone (`< 1024px`).
  * Modal interaktif otomatis beralih menjadi touch-friendly **Mobile Bottom Sheet**.

---

## 2. Diagram Arsitektur Sistem

```text
┌───────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 14)                      │
│                App Router + Tailwind + shadcn/ui              │
└───────────────────────────────┬───────────────────────────────┘
                                │ HTTP / REST (JSON)
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                      Backend (NestJS API)                     │
│    [ValidationPipe] ──▶ [Controllers] ──▶ [Services] ──▶ [Prisma]  │
└───────────────┬───────────────────────────────┬───────────────┘
                │                               │
       Database │ Prisma Client         Webhook │ REST API
                ▼                               ▼
┌────────────────────┐               ┌─────────────────────┐
│   PostgreSQL 16    │               │    n8n Automation   │
└────────────────────┘               │  • Cron Billing     │
        ▲                            │  • Notif Dispatcher │
        │ Webhook Callback           └─────────────────────┘
┌────────────────────┐
│  Midtrans Sandbox  │
└────────────────────┘
```

---

## 3. Tech Stack

| Layer | Teknologi | Alasan Pemilihan Teknis |
| :--- | :--- | :--- |
| **Package Manager** | `pnpm` (Workspace Monorepo) | Efisiensi disk, instalasi cepat, manajemen dependensi modern. |
| **Frontend** | Next.js 14 / App Router | Modern React Server Components, layouting cepat. |
| **UI Kit & Styling** | Tailwind CSS + shadcn/ui | Desain enterprise/dashboard profesional, clean, dan konsisten. |
| **Backend** | NestJS (TypeScript) | Standar industri korporat (Modular, DI, DTO ValidationPipe, Swagger auto-generated). |
| **Database & ORM** | PostgreSQL 16 + Prisma ORM | Relational ACID, type-safe query, migrasi deklaratif. |
| **Payment Gateway**| Midtrans Snap (Sandbox) | Standar gateway lokal, flow Snap modal, webhook verifikasi status. |
| **Automation** | n8n (Docker / Self-hosted) | Workflow engine visual untuk event-driven notification & cron checker. |

---

## 4. Struktur Project (pnpm Monorepo)

```text
kostConnect/
├── pnpm-workspace.yaml          # Konfigurasi workspace pnpm
├── package.json                 # Root script (dev, build, lint, seed)
├── docker-compose.yml           # PostgreSQL 16 + n8n container launch
├── Readme.md                    # Dokumentasi lengkap & arsitektur
│
├── apps/
│   ├── web/                     # FRONTEND (Next.js 14, Port 3000)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (dashboard)/
│   │   │   │   │   ├── properties/ # Modul 1: Properti & Kamar (Aset)
│   │   │   │   │   ├── tenants/    # Modul 2: Penyewa & Kontrak (CRM)
│   │   │   │   │   └── invoices/   # Modul 3: Tagihan & Pembayaran (Keuangan)
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx        # Overview Dashboard
│   │   │   ├── components/      # UI components & widgets
│   │   │   ├── lib/             # Axios API client
│   │   │   └── types/           # Shared TypeScript interfaces
│   │   └── package.json
│   │
│   └── api/                     # BACKEND (NestJS, Port 3001)
│       ├── prisma/
│       │   ├── schema.prisma    # 5 Model: Property, Room, Tenant, Contract, Invoice
│       │   ├── seed.ts          # Mock data realistis siap pakai untuk demo
│       │   └── migrations/      # Riwayat migrasi database
│       ├── src/
│       │   ├── modules/
│       │   │   ├── properties/  # Controller, Service, DTO (Modul 1)
│       │   │   ├── tenants/     # Controller, Service, DTO (Modul 2)
│       │   │   ├── invoices/    # Controller, Service, DTO (Modul 3)
│       │   │   ├── payments/    # Midtrans client & service
│       │   │   └── webhooks/    # Midtrans callback receiver & n8n dispatcher
│       │   ├── common/          # TransformInterceptor, Filters, PrismaService
│       │   └── main.ts          # Entry point + Swagger config
│       └── package.json
│
└── n8n/                         # WORKFLOWS n8n (Export JSON)
    ├── payment-notification.json     # Workflow 1: Notifikasi Tagihan Lunas
    └── overdue-invoice-checker.json  # Workflow 2: Scheduled Billing Check
```

---

## 5. Panduan Instalasi & Menjalankan Aplikasi

### Prasyarat:
* Node.js v20+ atau v24+
* PostgreSQL 16 (atau via Docker)
* pnpm (`npm i -g pnpm`)

### Langkah Menjalankan:

1. **Clone Repository & Masuk ke Folder:**
   ```bash
   git clone <repo-url>
   cd kostConnect
   ```

2. **Jalankan Database (Pilih salah satu):**
   * **Via Docker Compose:**
     ```bash
     docker compose up -d
     ```
   * **Atau PostgreSQL Lokal:**
     Pastikan PostgreSQL service lokal berjalan di port `5432`.

3. **Konfigurasi Environment Backend (`apps/api/.env`):**
   ```env
   PORT=3001
   DATABASE_URL="postgresql://postgres:PASSWORD_ANDA@localhost:5432/kosconnect_db?schema=public"
   MIDTRANS_SERVER_KEY="SB-Mid-server-XXXXX"
   MIDTRANS_CLIENT_KEY="SB-Mid-client-XXXXX"
   MIDTRANS_IS_PRODUCTION=false
   N8N_WEBHOOK_URL="http://localhost:5678/webhook/payment-success"
   ```

4. **Jalankan Migrasi Database & Seeding Data:**
   ```bash
   cd apps/api
   npx prisma migrate dev --name init
   npx prisma db seed
   cd ../..
   ```
   *(Data mock demo realistis untuk properti, unit kamar, penyewa, kontrak, dan invoice akan langsung terisi).*

5. **Jalankan Backend & Frontend Bersamaan:**
   Dari root folder:
   ```bash
   pnpm dev
   ```
   * **Frontend:** [http://localhost:3000](http://localhost:3000)
   * **Backend API:** [http://localhost:3001/api](http://localhost:3001/api)
   * **Dokumentasi Swagger:** [http://localhost:3001/api/docs](http://localhost:3001/api/docs)

---

## 6. Automasi n8n Workflows

File alur kerja n8n tersimpan di folder `/n8n` dan siap di-import:

1. **Workflow 1: `payment-notification.json` (Event-Driven Webhook)**
   * **Trigger:** Webhook POST di `/webhook/payment-success` menerima payload saat invoice sukses dibayar.
   * **Aksi:** Memformat pesan konfirmasi dan mendispatch log notifikasi ke email/chat log.
2. **Workflow 2: `overdue-invoice-checker.json` (Scheduled Cron)**
   * **Trigger:** Jadwal cron harian (08:00 WIB).
   * **Aksi:** Melakukan HTTP GET ke endpoint NestJS `http://localhost:3001/api/invoices?status=UNPAID`, memfilter tagihan yang mendekati jatuh tempo ($\le$ 3 hari), lalu membuat summary report harian.

---

## 7. Format Standar Respons API

Seluruh respons API dibungkus oleh **Global Transform Interceptor**:
```json
{
  "success": true,
  "data": { ... },
  "message": "Request successful"
}
```
Dan bila terjadi kesalahan (error):
```json
{
  "success": false,
  "data": null,
  "message": "Pesan deskripsi kesalahan"
}
```

---

## 8. Database Indexing & Optimasi Query (High Performance)

Untuk memastikan respons kueri instan tanpa bottleneck ketika volume transaksi dan inventaris unit membesar:
* `Room`: `@@index([propertyId, status])` — Akselerasi pemfilteran kamar kosong (`AVAILABLE`) vs terisi (`OCCUPIED`) per properti.
* `Contract`: `@@index([tenantId, status])`, `@@index([roomId, status])` — Pencarian cepat status kontrak aktif & riwayat sewa penghuni.
* `Invoice`: `@@index([contractId, status])`, `@@index([dueDate, status])` — Optimasi agregasi finansial dashboard, query cron tagihan jatuh tempo, dan rekonsiliasi Midtrans.
* `Property`: `@@index([ownerId])` — Menjamin isolasi data antar pemilik kos (Multi-tenant data scoping).

---

## 9. Kredensial Demo & Panduan Pengujian (Reviewer Walkthrough)

| Peran (Role) | Email Login | Password Default | Lingkup Akses & Pengujian yang Direkomendasikan |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@kosconnect.com` | `admin123` | • Buka `/properties` (Daftarkan kos baru & pilih pemilik dari dropdown mitra).<br>• Buka `/tenants` (Daftarkan Akun Mitra Pemilik Kos baru).<br>• Buka `/invoices` (Audit transaksi platform & cek estimasi revenue platform 2.5%). |
| **Pemilik Kos** | `owner@harmoni.com` | `owner123` | • Buka `/properties` (Tambah unit kamar baru dengan separator ribuan otomatis `Rp 1.800.000`).<br>• Buka `/tenants` (Daftarkan akun penyewa baru & terbitkan kontrak sewa).<br>• Buka `/invoices` (Terbitkan tagihan baru, kirim notifikasi WhatsApp). |
| **Penyewa** | `tenant@budi.com` | `tenant123` | • Buka `/portal` atau `/invoices` (Klik **Bayar Sekarang** untuk memicu Midtrans Snap atau Simulasi Lunas Instan). |
| **Akun Baru (Uji Keamanan)** | Dibuat via form dashboard | `123456789` | • Uji proteksi **Force Password Change**: Wajib memasukkan password lama & menetapkan password baru berstandar enterprise (min 8 karakter, kombinasi huruf besar/kecil/angka/simbol). |

---

*Disusun oleh: Ajis Maulana Shadiq — Technical Test KosConnect ERP (Lite)*

