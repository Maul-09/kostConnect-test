# KosConnect ERP (Lite) — Sistem Operasional Properti & Kos

Mini Property ERP system for rental property business operations (boarding houses/apartments).  
Dikembangkan untuk **Technical Test Assessment** oleh **Ajis Maulana Shadiq**.

---

> [!TIP]
> **Panduan Cepat Reviewer (Quick Start):**  
> Ingin langsung mencoba aplikasi dalam 2 menit? Langsung lompat ke bagian [5. Panduan Instalasi & Menjalankan](#5-panduan-instalasi--menjalankan) dan [6. Panduan Pengujian Demo (Reviewer Walkthrough)](#6-panduan-pengujian-demo-reviewer-walkthrough).

---

## 1. Ringkasan Eksekutif (Executive Summary)

**KosConnect ERP** adalah platform SaaS manajemen persewaan properti (kos-kosan/apartemen/kontrakan) multi-mitra modern yang dirancang untuk mengotomatiskan seluruh siklus operasional bisnis sewa properti:

```
[Aset: Unit Kamar] ──▶ [CRM: Kontrak Sewa] ──▶ [Keuangan: Invoice] ──▶ [Payment Gateway] ──▶ [Otomasi: n8n]
   AVAILABLE              Auto OCCUPIED          INV-2026XX-XXXX       Midtrans Snap / DANA      Notifikasi Webhook
```

Sistem ini **bukan sekadar aplikasi CRUD form generik**, melainkan sistem ERP dengan **ketergantungan logika bisnis (*interdependent business logic*)**:
* Status ketersediaan kamar (`AVAILABLE` vs `OCCUPIED`) **dikendalikan secara otomatis oleh siklus kontrak sewa**, bukan diedit manual tanpa konteks.
* Penerbitan invoice terikat pada kontrak sewa yang aktif.
* Pelunasan tagihan melalui **Midtrans Snap Sandbox** secara otomatis memicu verifikasi status pelunasan serta mendispatch notifikasi otomatis melalui **n8n Automation**.

---

## 2. Pemenuhan Kebutuhan Teknis (Requirement Compliance)

Seluruh butir kriteria evaluasi teknis telah diimplementasikan 100%:

| Kriteria Penilaian | Implementasi Teknis di KosConnect ERP | Bukti & Lokasi |
| :--- | :--- | :--- |
| **1. Minimal 3 Modul Utama (ERP)** | • **Modul 1 (Aset):** Master Properti & Unit Kamar, status `AVAILABLE`/`OCCUPIED`.<br>• **Modul 2 (CRM):** Manajemen Penghuni, Kontrak Sewa berjangka, Check-out otomatis.<br>• **Modul 3 (Finansial):** Penerbitan Invoice, Payment Gateway, Platform Fee (2.5%), Audit Log. | `apps/web/src/app/(dashboard)/` & `apps/api/src/modules/` |
| **2. API Connection (Internal & Eksternal)** | • **Internal:** RESTful API NestJS modular + Swagger OpenAPI.<br>• **Eksternal 1:** Midtrans Snap Payment Gateway API.<br>• **Eksternal 2:** Public Currency Exchange API (kurs realtime USD ⇄ IDR). | `/api/docs` & `/api/currency` |
| **3. Payment Gateway (Sandbox / Mock)** | Integrasi **Midtrans Snap Sandbox** (QRIS, VA Bank, DANA/GoPay) + verifikasi signature key SHA512 + tombol **Simulasi Instan (Mock Demo)** tanpa internet. | `apps/api/src/modules/payments/` & `invoices/page.tsx` |
| **4. Otomasi Workflow n8n** | • **Workflow 1 (Event-driven):** Notifikasi webhook otomatis saat invoice lunas.<br>• **Workflow 2 (Scheduled Cron):** Cron checker tagihan yang mendekati jatuh tempo. | Folder `/n8n/` (File JSON siap import) |
| **5. Frontend Modern** | **Next.js 16 (App Router)** + TypeScript + Tailwind CSS + shadcn/ui + Dark Glassmorphism + Skeleton Loaders + Custom Confirmation Modals. | `apps/web` |
| **6. Backend Non-Firebase** | **NestJS 11 (TypeScript)** enterprise corporate standard + PostgreSQL 16 ACID + Prisma ORM. | `apps/api` |
| **7. Optimasi Database & Query** | Compound Indexing B-Tree PostgreSQL (`Room`, `Contract`, `Invoice`, `Property`) untuk query cepat tanpa bottleneck. | `prisma/schema.prisma` |
| **8. Kredensial & Dokumentasi** | Dokumentasi lengkap di `README.md`, file `.env.example` siap pakai, data dummy realistis di database seed. | Root project |

---

## 3. Matriks Hak Akses & Pembagian Tanggung Jawab Halaman

Sistem memisahkan tanggung jawab setiap halaman secara ketat (*Single Responsibility Principle*) agar tidak terjadi kebocoran fungsionalitas antar peran:

| Halaman | Super Admin (Platform Operator) | Pemilik Kos (Property Owner) | Penyewa (Tenant) |
| :--- | :--- | :--- | :--- |
| **`/` (Dashboard Overview)** | Monitoring KPI platform: Total Kos, Kamar terdaftar, Total GMV, dan Estimasi Revenue Platform (2.5%). | Monitoring operasional kos miliknya: Tingkat okupansi, sewa aktif, pendapatan bulanan. | Ringkasan sewa aktif, masa berlaku, dan tagihan berjalan. |
| **`/properties` (Manajemen Aset)** | Daftarkan properti mitra baru (pilih pemilik dari dropdown mitra terdaftar). | Kelola unit kamar kos, set harga sewa (format titik ribuan otomatis `Rp 1.800.000`), fasilitas kamar. | Katalog informasi kamar dan fasilitas kos yang dihuni. |
| **`/tenants` (Direktori & CRM)** | Direktori mitra pemilik kos (+ **Daftarkan Akun Pemilik Kos Baru**) & direktori master penyewa. | Daftarkan akun penyewa (+ **Buat Akun Penyewa Baru**), terbitkan Kontrak Sewa baru, dan proses Check-out sewa. | Rincian data kontrak sewa aktif dan kontak pemilik kos. |
| **`/invoices` (Keuangan & Penagihan)** | **Audit-Only Log & Revenue Platform (2.5%)**: Memantau seluruh transaksi platform & log Midtrans. *(Tanpa tombol buat tagihan / bayar).* | **Penerbitan Tagihan**: Terbitkan invoice sewa kamar ke penyewa, pantau status pembayaran, kirim pengingat tagihan ke WhatsApp. | **Pembayaran Mandiri**: Melihat tagihan, bayar via Midtrans Snap (tab baru), dan cetak struk pelunasan resmi. |
| **`/portal` (Portal Penyewa)** | *Akses dialihkan ke dashboard operasional.* | *Akses dialihkan ke dashboard kos.* | Portal mandiri sewa kamar, rincian fasilitas, dan histori transaksi. |

---

## 4. Alur Keamanan & Onboarding Enterprise (Closed-Loop)

Untuk menjaga integritas data dan keamanan operasional bisnis rental properti:

```
[Super Admin] ──▶ Buat Akun Pemilik Kos (Password Sementara 123456789)
                       │
                       ▼
[Pemilik Kos] ──▶ Login Pertama Kali ──▶ [Wajib Ganti Password Baru (Enterprise Policy)]
                       │
                       ▼
                 Buat Akun Penyewa (Password Sementara 123456789)
                       │
                       ▼
[Penyewa Kos] ──▶ Login Pertama Kali ──▶ [Wajib Ganti Password Baru] ──▶ Bayar Sewa via Midtrans
```

1. **Tanpa Registrasi Publik Mandiri:** Akun Pemilik dibuat oleh Super Admin; Akun Penyewa dibuat oleh Pemilik Kos.
2. **Fitur Salin Kredensial Sekali Klik:** Setelah akun didaftarkan, modal akan menyajikan tombol salin otomatis yang menyalin **Email dan Password Sementara** (`123456789`) sekaligus ke clipboard.
3. **Modal Wajib Ganti Password (Force Password Change):**
   * Pengguna baru wajib mengganti password saat pertama kali login.
   * Layar terkunci sampai pengguna memasukkan password lama (`123456789`) dan menetapkan password baru yang memenuhi standar keamanan enterprise (**Minimal 8 karakter, kombinasi huruf besar, huruf kecil, angka, dan karakter khusus/simbol**).
   * Dilengkapi fitur interaktif *Show/Hide Password* di setiap kolom.

---

## 5. Panduan Instalasi & Menjalankan

### Prasyarat:
* Node.js v20+ atau v24+
* pnpm (`npm i -g pnpm`)
* PostgreSQL 16 (atau via Docker)

### Langkah 1: Clone Repository
```bash
git clone <URL_REPOSITORY_ANDA>
cd kostConnect
```

### Langkah 2: Menjalankan Database PostgreSQL & n8n (Pilih Salah Satu)

* **Opsi A — Menggunakan Docker Compose (Direkomendasikan, 1-Command):**
  ```bash
  docker compose up -d
  ```
  *Ini akan menyalakan container PostgreSQL di port `5432` dan container n8n di port `5678` secara otomatis.*

* **Opsi B — Menggunakan PostgreSQL Lokal:**
  Pastikan database service PostgreSQL lokal Anda aktif di port `5432` dengan database `kosconnect_db`.

### Langkah 3: Konfigurasi Environment (`.env`)
Salin file template environment yang sudah disediakan:
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Isi konfigurasi `apps/api/.env`:
```env
PORT=3001
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/kosconnect_db?schema=public"

# Midtrans Sandbox Keys (Gunakan key Sandbox Anda atau biarkan default untuk mode demo)
MIDTRANS_SERVER_KEY="SB-Mid-server-kunci-sandbox-anda"
MIDTRANS_CLIENT_KEY="SB-Mid-client-kunci-sandbox-anda"
MIDTRANS_IS_PRODUCTION=false

# n8n Webhook URL (Dipanggil otomatis saat invoice LUNAS)
N8N_WEBHOOK_URL="http://localhost:5678/webhook/payment-success"
```

### Langkah 4: Install Dependensi, Migrasi Database & Seeding
Dari root folder proyek:
```bash
# Install seluruh packages di monorepo
pnpm install

# Jalankan migrasi Prisma & seeding data dummy realistis
pnpm seed
```

### Langkah 5: Jalankan Aplikasi
Dari root folder:
```bash
pnpm dev
```

Aplikasi siap diakses di browser:
* 🌐 **Frontend Web:** [http://localhost:3000](http://localhost:3000)
* ⚙️ **Backend REST API:** [http://localhost:3001/api](http://localhost:3001/api)
* 📖 **Dokumentasi Swagger OpenAPI:** [http://localhost:3001/api/docs](http://localhost:3001/api/docs)
* 🤖 **n8n Automation Console:** [http://localhost:5678](http://localhost:5678)

---

## 6. Panduan Pengujian Demo (Reviewer Walkthrough)

Di pojok kanan atas aplikasi terdapat **Role Switcher Dropdown** interaktif untuk berpindah perspektif pengguna secara instan tanpa perlu logout/login manual.

### Skenario 1: Pengujian Role Super Admin (Platform Operator)
* **Kredensial:** `superadmin@kosconnect.com` / `admin123`
* **Langkah Uji Coba:**
  1. Buka [http://localhost:3000](http://localhost:3000) &rarr; pilih role **Super Admin**.
  2. Buka menu **Pendaftaran Properti** (`/properties`):
     * Coba klik "+ Tambah Properti".
     * Perhatikan bahwa pemilik properti dipilih dari **Dropdown Mitra Terdaftar** (bukan form buat akun, sesuai *Separation of Concerns*).
  3. Buka menu **Direktori Pengguna** (`/tenants`):
     * Klik **"+ Daftarkan Pemilik Kos"**. Masukkan nama, email, nomor HP.
     * Salin kredensial yang muncul (Email & Password Sementara `123456789`).
  4. Buka menu **Tagihan & Pembayaran** (`/invoices`):
     * Pastikan **TIDAK ADA tombol transaksi sewa** (tidak ada tombol buat tagihan atau bayar).
     * Perhatikan kartu metrik ke-3: **"ESTIMASI REVENUE PLATFORM (2.5%)"** yang mengkalkulasi komisi platform dari seluruh volume sewa lunas.

### Skenario 2: Pengujian Role Pemilik Kos (Property Owner)
* **Kredensial:** `owner@harmoni.com` / `owner123`
* **Langkah Uji Coba:**
  1. Ganti role ke **Pemilik Kos**.
  2. Buka menu **Manajemen Kamar** (`/properties`):
     * Klik "+ Tambah Kamar Kos".
     * Masukkan nomor kamar dan harga sewa. Perhatikan bahwa input harga **otomatis memformat titik ribuan secara instan** (ketik `1800000` otomatis menjadi `1.800.000`).
  3. Buka menu **Penghuni & Kontrak** (`/tenants`):
     * Klik **"+ Daftarkan Penyewa Kos"** untuk membuat akun penyewa baru.
     * Klik **"+ Buat Kontrak Sewa"**: Pilih penyewa dan kamar kosong. Begitu kontrak disimpan, perhatikan bahwa status kamar otomatis terkunci menjadi **`OCCUPIED`**.
     * Uji tombol **"Check-out"**: Konfirmasi dialog modal kustom, status kamar otomatis kembali menjadi **`AVAILABLE`**.
  4. Buka menu **Tagihan Sewa** (`/invoices`):
     * Klik "+ Terbitkan Invoice", pilih kontrak sewa penghuni, masukkan nominal.
     * Uji tombol **"Ingatkan WA"** untuk membuka format pesan WhatsApp otomatis ke nomor penyewa.

### Skenario 3: Pengujian Role Penyewa & Pembayaran Midtrans Snap Sandbox
* **Kredensial:** `tenant@budi.com` / `tenant123`
* **Langkah Uji Coba:**
  1. Ganti role ke **Penyewa**.
  2. Buka menu **Tagihan Sewa Saya** (`/invoices` atau `/portal`).
  3. Pada baris invoice berstatus `BELUM DIBAYAR`, klik **"Bayar Sekarang"**:
     * Sistem membuka halaman pembayaran resmi **Midtrans Snap Sandbox** di tab baru.
     * Pilih metode pembayaran yang diinginkan:
       * **Virtual Account:** Pilih bank (BCA / BNI / BRI / Mandiri / Permata), salin nomor VA, lalu buka [Midtrans VA Simulator](https://simulator.sandbox.midtrans.com/bca/va/index) untuk klik *Pay*.
       * **QRIS / GoPay:** Scan kode QR via aplikasi simulator.
       * **Kartu Kredit (Sandbox):** Masukkan test card `4811 1111 1111 1114` dan OTP `112233`.
     * Begitu pembayaran diselesaikan, tab Midtrans akan **tetap standby** menampilkan status centang hijau **"Pembayaran Berhasil"** dengan nomor Order ID.
     * Cukup beralih kembali (*switch tab*) ke aplikasi KosConnect ERP:
       * Sistem otomatis mendeteksi fokus layar (*Window Focus Detection*), memverifikasi pelunasan secara instan, mengubah status tagihan menjadi **LUNAS (PAID)**, dan memunculkan **Modal Kuitansi Selebrasi Lunas** lengkap dengan rincian bukti transaksi!

### Skenario 4: Pengujian Pusat Notifikasi Interaktif (Notification Center)
1. Klik **Ikon Lonceng Notifikasi** di pojok kanan atas (terdapat badge merah counter belum dibaca).
2. Klik salah satu pesan notifikasi pada daftar:
   * Sistem **TIDAK HANYA** menandai pesan sebagai dibaca, melainkan membuka **Popup Modal Rincian Notifikasi** interaktif yang memuat kategori, rincian metadata (No. Invoice, Kamar, Nominal), serta tombol aksi langsung (*Buka Halaman Tagihan* / *Lihat Kontrak Sewa*).

### Skenario 5: Pengujian Proteksi Wajib Ganti Password (Keamanan Akun Baru)
1. Gunakan akun pemilik/penyewa yang baru saja didaftarkan dengan password sementara `123456789`.
2. Saat pertama kali masuk, layar otomatis terkunci dengan modal **"Wajib Ganti Password Baru"**.
3. Uji validasi keamanan:
   * Masukkan password lama yang salah &rarr; ditolak sistem.
   * Masukkan password baru yang terlalu pendek atau tanpa angka/simbol &rarr; indikator checklist password tetap merah.
   * Masukkan password yang memenuhi standar enterprise (contoh: `KosBaru2026!`) &rarr; sukses dan akun terproteksi penuh.

---

## 7. Automasi Alur Kerja n8n (Automation Workflows)

Untuk memenuhi kriteria **Automation Tools menggunakan n8n**, KosConnect ERP telah dilengkapi dengan 2 arsitektur alur kerja automasi yang dapat langsung diimpor ke n8n:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ARSITEKTUR OTOMASI N8N                          │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  [Alur 1: Event-Driven Webhook (Realtime)]                             │
│  Penyewa Bayar (Midtrans) ──▶ NestJS Webhook Handler                   │
│                                      │                                 │
│                                      ▼ POST JSON Payload               │
│                        n8n Webhook: /webhook/payment-success           │
│                                      │                                 │
│                                      ▼ Format Pesan Konfirmasi         │
│                        Dispatched ke Email / WhatsApp / Log            │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  [Alur 2: Scheduled Cron Job (Harian)]                                 │
│  Cron Trigger (08:00 WIB) ──▶ GET /api/invoices?status=UNPAID          │
│                                      │                                 │
│                                      ▼ Filter Tagihan Jatuh Tempo (H-3)│
│                        Kompilasi Laporan Rekap Tagihan                 │
│                                      │                                 │
│                                      ▼                                 │
│                        Kirim Notifikasi Laporan ke Pemilik Kos         │
└────────────────────────────────────────────────────────────────────────┘
```

### Rincian File Workflow (Folder `/n8n`):

1. **`n8n/payment-notification.json` (Event-Driven Webhook)**
   * **Node 1 (Webhook Trigger):** Menerima HTTP POST di path `payment-success`.
   * **Node 2 (Format Confirmation Message):** Menyusun template pesan konfirmasi: *"Halo {tenantName}, pembayaran invoice {invoiceNumber} untuk kamar {roomNumber} sebesar Rp {amount} telah BERHASIL diverifikasi lunas..."*.
   * **Node 3 (Dispatch Notification):** Mengirimkan data notifikasi ke kanal tujuan (Email/Chat Webhook).

2. **`n8n/overdue-invoice-checker.json` (Scheduled Billing Check)**
   * **Node 1 (Schedule Trigger):** Berjalan otomatis setiap hari pukul 08:00 WIB.
   * **Node 2 (HTTP Request):** Memanggil API internal KosConnect `GET http://localhost:3001/api/invoices?status=UNPAID`.
   * **Node 3 (Code Node):** Menghitung tanggal jatuh tempo tagihan yang berjarak $\le 3$ hari ke depan.
   * **Node 4 (Dispatch Report):** Mengirimkan rekap tagihan tertunggak ke pengelola kos.

### Cara Menjalankan & Menguji n8n:
1. Pastikan container n8n aktif (jalankan `docker compose up -d`).
2. Buka dashboard n8n di peramban: [http://localhost:5678](http://localhost:5678).
3. Buat akun n8n lokal (atau skip jika sudah ada).
4. Klik tombol **"Add workflow"** &rarr; klik ikon menu **`...`** (titik tiga di kanan atas) &rarr; pilih **"Import from File"**.
5. Pilih file `n8n/payment-notification.json` dari repositori ini.
6. Klik **"Test workflow"** atau geser tombol toggle menjadi **"Active"**.
7. Lakukan pembayaran invoice di website KosConnect &rarr; perhatikan eksekusi workflow di n8n akan langsung hijau (*Success*) menerima data tagihan yang baru saja lunas!

---

## 8. Struktur Direktori Proyek (Monorepo)

```text
kostConnect/
├── pnpm-workspace.yaml          # Konfigurasi workspace pnpm
├── package.json                 # Skrip terpadu (dev, build, seed)
├── docker-compose.yml           # PostgreSQL 16 + n8n container ready
├── Readme.md                    # Dokumentasi lengkap & arsitektur
│
├── apps/
│   ├── web/                     # FRONTEND (Next.js 16 App Router, Port 3000)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (dashboard)/
│   │   │   │   │   ├── properties/ # Modul 1: Properti & Kamar (Aset)
│   │   │   │   │   ├── tenants/    # Modul 2: Penyewa & Kontrak (CRM)
│   │   │   │   │   └── invoices/   # Modul 3: Tagihan & Pembayaran (Keuangan)
│   │   │   │   ├── portal/         # Portal mandiri penyewa kos
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx        # Dashboard Overview
│   │   │   ├── components/      # UI components & widgets
│   │   │   ├── context/         # RoleContext, FeedbackContext, NotificationContext
│   │   │   ├── lib/             # Axios API client, utils format ribuan
│   │   │   └── types/           # Shared TypeScript interfaces
│   │   └── package.json
│   │
│   └── api/                     # BACKEND (NestJS 11, Port 3001)
│       ├── prisma/
│       │   ├── schema.prisma    # 6 Model: Property, Room, Tenant, Contract, Invoice, User
│       │   ├── seed.ts          # Mock data realistis siap demo
│       │   └── migrations/      # Riwayat migrasi database PostgreSQL
│       ├── src/
│       │   ├── modules/
│       │   │   ├── properties/  # Controller, Service, DTO (Modul 1)
│       │   │   ├── tenants/     # Controller, Service, DTO (Modul 2)
│       │   │   ├── invoices/    # Controller, Service, DTO (Modul 3)
│       │   │   ├── users/       # Manajemen akun pemilik kos
│       │   │   ├── payments/    # Midtrans client, live status check & token
│       │   │   ├── webhooks/    # Midtrans signature SHA512 listener & n8n dispatcher
│       │   │   └── currency/    # External Public Currency API (IDR ⇄ USD)
│       │   ├── common/          # TransformInterceptor, Filters, PrismaService
│       │   └── main.ts          # Entry point, Helmet, CORS, Swagger setup
│       └── package.json
│
└── n8n/                         # WORKFLOWS n8n (Exported JSON)
    ├── payment-notification.json     # Workflow 1: Notifikasi Tagihan Lunas
    └── overdue-invoice-checker.json  # Workflow 2: Scheduled Billing Check
```

---

## 9. Format Standar Respons API

Seluruh endpoint backend mengimplementasikan **Global Transform Interceptor** untuk menjamin struktur respons yang seragam:

**Respons Sukses (HTTP 200/201):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Request successful"
}
```

**Respons Kesalahan / Error Validation (HTTP 400/404/500):**
```json
{
  "success": false,
  "data": null,
  "message": "Pesan deskripsi validasi atau error yang informatif"
}
```

---

## 10. Catatan Tambahan untuk Klien / Tim Penilai

1. **Dual-Mode Pembayaran:** Aplikasi mendukung pembayaran Midtrans Sandbox nyata secara *live* sekaligus menyediakan mode *mock fallback* tanpa internet. Jika penguji tidak memiliki akun Midtrans aktif, seluruh skenario transaksi tetap dapat diuji 100% menggunakan tombol simulasi.
2. **Kerapian Format Angka:** Seluruh input nominal sewa di aplikasi otomatis memformat titik ribuan (`18000` &rarr; `18.000`) untuk mencegah kesalahan ketik pengguna (*human error*).
3. **Resiliency:** Dilengkapi sistem *graceful fallback* pada koneksi pihak ketiga (Midtrans, n8n, Currency API) sehingga jika salah satu layanan eksternal mengalami kendala jaringan, server utama aplikasi tetap berjalan stabil tanpa kendala.

---

*Disusun dengan dedikasi oleh: **Ajis Maulana Shadiq** — Technical Test KosConnect ERP (Lite)*
