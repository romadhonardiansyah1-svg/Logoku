# Requirements Document

## Introduction

LogoKu adalah aplikasi web jasa desain logo (berbahasa Indonesia) yang saat ini berjalan di PHP + MySQL (XAMPP). Dokumen ini mendefinisikan kebutuhan untuk membangun ulang aplikasi menjadi **situs statis murni** yang di-host di **Netlify** dengan **Supabase** (Postgres + Auth + Storage) sebagai backend. **Tidak ada server tier / Netlify Functions** dan **tidak ada OTP / WhatsApp API**: pemesanan adalah chat langsung via tautan `wa.me`. Empat halaman hasil redesign (Landing, Login, Dashboard, Brief) menjadi acuan UX. Otorisasi sepenuhnya ditegakkan oleh Row Level Security (RLS).

Requirements diturunkan dari `design.md`. Setiap Correctness Property pada design dapat ditelusuri ke requirement di bawah.

## Glossary
- **Anon key**: kunci publik Supabase yang aman dipakai di browser, dibatasi oleh RLS.
- **RLS**: Row Level Security pada Postgres/Supabase.
- **submit_brief**: fungsi RPC `SECURITY DEFINER` di Postgres yang menyimpan order publik secara atomik.
- **Admin disetujui**: akun dengan `admin_profiles.role ∈ {admin, owner}`.
- **wa.me handoff**: membuka chat WhatsApp langsung ke nomor admin dengan pesan terisi.

## Requirements

### Requirement 1: Browsing Landing & Katalog Publik

**User Story:** Sebagai calon pelanggan, saya ingin membuka halaman utama dan menelusuri katalog desain berdasarkan kategori, agar saya dapat menemukan gaya logo yang sesuai sebelum memesan.

#### Acceptance Criteria
1. WHEN pengunjung membuka halaman utama THEN sistem SHALL menampilkan hero, statistik, benefit, galeri katalog, langkah pemesanan, paket harga, testimoni, dan FAQ tanpa memerlukan login.
2. WHEN halaman katalog dimuat THEN sistem SHALL mengambil data `categories` dan `catalogs` yang `is_published = true` dari Supabase menggunakan anon key.
3. WHEN pengunjung mengklik sebuah filter kategori THEN sistem SHALL menampilkan hanya item katalog yang cocok dengan slug kategori tersebut, dan menampilkan semua item saat filter "Semua Kategori" dipilih.
4. IF data katalog kosong atau gagal dimuat THEN sistem SHALL menampilkan kartu fallback statis sehingga halaman tetap berfungsi.
5. WHEN pengunjung mengklik "Gunakan Gaya Ini" pada item katalog THEN sistem SHALL mengarahkan ke `brief.html?ref=<id>`.
6. WHEN pengunjung mengklik tombol konsultasi/WhatsApp THEN sistem SHALL membuka tautan `wa.me` ke nomor admin yang dikonfigurasi.

### Requirement 2: Tampilan Paket Harga

**User Story:** Sebagai calon pelanggan, saya ingin melihat paket harga yang jelas, agar saya bisa memilih paket dan langsung memesan.

#### Acceptance Criteria
1. WHEN bagian harga dimuat THEN sistem SHALL menampilkan keempat paket (80k, 140k, 199k, 250k) beserta daftar fitur termasuk/tidak termasuk.
2. WHEN pengunjung mengklik "Pilih Paket" pada salah satu paket THEN sistem SHALL mengarahkan ke `brief.html?paket=<1..4>`.

### Requirement 3: Pengiriman Brief & Handoff WhatsApp

**User Story:** Sebagai pelanggan, saya ingin mengisi brief kreatif lalu langsung diarahkan ke WhatsApp admin, agar pesanan saya tercatat dan saya bisa lanjut chat tanpa proses berbelit.

#### Acceptance Criteria
1. WHEN halaman brief dibuka dengan `?paket=` atau `?ref=` THEN sistem SHALL menampilkan paket/referensi yang dipilih.
2. WHEN pengguna mengisi nomor WhatsApp THEN sistem SHALL menormalisasi nomor ke format `62xxx` secara idempoten di sisi klien.
3. WHEN pengguna mengirim brief THEN sistem SHALL memvalidasi field wajib (nama, brand, deskripsi), format warna hex, dan honeypot di sisi klien sebelum menyimpan.
4. WHEN validasi lolos THEN sistem SHALL memanggil RPC `submit_brief` (anon key) yang melakukan upsert `customers` dan menyisipkan satu baris `orders` secara atomik dengan `progress_status='Antrean'` dan `payment_status='Belum Lunas'`.
5. WHEN order berhasil dibuat THEN RPC SHALL menghasilkan `order_number` berformat `LKU-<tahun>-<id berpadding>` yang unik dan mengembalikannya ke browser.
6. WHEN order berhasil tersimpan THEN sistem SHALL membuka tautan `wa.me` ke nomor admin dengan ringkasan pesanan (order number, nama, brand, warna) terisi; IF penyimpanan gagal THEN sistem SHALL menampilkan pesan error dan TIDAK membuka WhatsApp.
7. IF honeypot terisi THEN sistem SHALL membatalkan pengiriman secara diam-diam.
8. The system SHALL NOT mengizinkan anon membaca kembali (`select`) data `orders`/`customers`; penyimpanan publik hanya lewat RPC `submit_brief`.

### Requirement 4: Autentikasi Admin (Masuk, Daftar, Role Gate)

**User Story:** Sebagai admin, saya ingin masuk atau mendaftar dengan email/sandi, agar saya dapat mengelola pesanan, dan akses hanya diberikan setelah disetujui.

#### Acceptance Criteria
1. WHEN admin mengisi tab "Masuk" dengan email dan sandi yang benar THEN sistem SHALL melakukan `signInWithPassword` via Supabase Auth dan mengarahkan ke dashboard.
2. WHEN pengguna mengisi tab "Daftar" THEN sistem SHALL melakukan `signUp` dengan menyertakan `full_name`, dan trigger database SHALL membuat baris `admin_profiles` dengan `role='pending'`.
3. WHEN sebuah akun baru terdaftar THEN sistem SHALL memberi tahu bahwa akun menunggu persetujuan sebelum dapat mengakses dashboard.
4. WHEN dashboard dimuat THEN sistem SHALL memeriksa sesi dan `admin_profiles.role`; IF role bukan `admin`/`owner` THEN sistem SHALL menampilkan pesan "menunggu persetujuan", melakukan sign out, dan mengarahkan ke halaman login.
5. WHEN admin menekan "Keluar" THEN sistem SHALL mengakhiri sesi Supabase Auth dan mengarahkan ke halaman login.
6. IF pengguna mengakses dashboard tanpa sesi valid THEN sistem SHALL mengarahkan ke halaman login.

### Requirement 5: Dashboard Admin — Ringkasan & Pesanan

**User Story:** Sebagai admin yang disetujui, saya ingin melihat ringkasan dan mengelola pesanan, agar saya dapat memantau dan memperbarui progres serta pembayaran.

#### Acceptance Criteria
1. WHEN dashboard dimuat oleh admin disetujui THEN sistem SHALL menampilkan kartu statistik, distribusi status progres, pesanan terbaru, dan tabel pesanan masuk.
2. WHEN tabel pesanan dimuat THEN sistem SHALL membaca `orders` (join `customers`) langsung via supabase-js dengan JWT admin di bawah RLS, diurutkan dari terbaru.
3. WHEN admin menyaring tabel berdasarkan status THEN sistem SHALL menampilkan hanya pesanan yang cocok, dan menampilkan pesan "Belum ada pesanan pada filter ini" bila kosong.
4. WHEN admin membuka modal "Pesanan Manual" dan menyimpan THEN sistem SHALL melakukan upsert `customers` dan insert `orders` langsung via supabase-js (RLS `is_admin()`).
5. WHEN admin mengedit atau menghapus pesanan THEN sistem SHALL melakukan update/delete langsung via supabase-js di bawah RLS, lalu menyegarkan tabel dan menampilkan toast keberhasilan.
6. WHEN admin mengklik aksi chat pada sebuah pesanan THEN sistem SHALL membuka `wa.me` ke nomor WhatsApp pelanggan terkait.
7. The system SHALL memvalidasi bahwa `dp_amount <= total_amount` saat menyimpan/mengubah pesanan (di klien dan oleh constraint database).
8. WHEN admin menyimpan pengaturan profil THEN sistem SHALL menyimpan perubahan dan menampilkan konfirmasi.

### Requirement 6: Manajemen Katalog & Storage Gambar

**User Story:** Sebagai admin, saya ingin mengunggah dan mengelola gambar katalog, agar galeri di landing menampilkan portofolio terbaru.

#### Acceptance Criteria
1. WHEN admin mengunggah gambar katalog THEN sistem SHALL menyimpan berkas ke Supabase Storage bucket `catalog-images` dan menyimpan object path pada `catalogs.image_path`.
2. The system SHALL mengizinkan baca publik pada `catalog-images` dan menulis hanya oleh admin (Storage RLS `is_admin()`).
3. WHEN landing menampilkan item katalog THEN sistem SHALL membangun URL publik dari `image_path`.
4. The system SHALL menyimpan bukti pembayaran pada bucket privat `payment-proofs` yang hanya dapat dibaca admin.

### Requirement 7: Keamanan, RLS, dan Isolasi

**User Story:** Sebagai pemilik sistem, saya ingin data terlindungi tanpa server tier, agar arsitektur sederhana namun aman.

#### Acceptance Criteria
1. The system SHALL mengaktifkan RLS pada semua tabel dengan default-deny dan kebijakan eksplisit sesuai design; RLS adalah satu-satunya batas otorisasi.
2. The system SHALL mengizinkan anon melakukan `select` hanya pada `catalogs` yang published dan `categories`; tidak pada `orders`, `customers`, atau `admin_profiles` milik orang lain.
3. The system SHALL membatasi semua mutasi pada `orders`, `customers`, dan `catalogs` hanya untuk admin disetujui melalui RLS `is_admin()`.
4. The system SHALL hanya menyertakan nilai client-safe (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `ADMIN_WHATSAPP_NUMBER`) pada bundle client, dan SHALL NOT menggunakan service-role key atau secret server apa pun.
5. The system SHALL menjamin tidak ada server tier (tidak ada Netlify Functions) sehingga tidak ada secret berhak istimewa yang perlu disembunyikan.
6. WHEN terjadi error dari Supabase THEN sistem SHALL menampilkan pesan ramah ke pengguna tanpa membocorkan pesan database mentah.

### Requirement 8: Struktur Proyek, Build & Deploy Netlify

**User Story:** Sebagai developer, saya ingin proyek tersusun untuk deploy statis di Netlify dengan Supabase, agar rilis dan pemeliharaan mudah.

#### Acceptance Criteria
1. The system SHALL menyusun proyek: halaman HTML statis di root, `assets/`, `supabase/migrations/`, `netlify.toml`, `package.json`, `.env.example`, dan arsip PHP lama di `_legacy/`.
2. The system SHALL memindahkan seluruh berkas PHP/SQL/includes/core/admin lama ke `_legacy/` (diarsipkan, dikecualikan dari publish) tanpa menghapusnya pada tahap ini.
3. The system SHALL menyediakan `netlify.toml` dengan `publish` tanpa direktori functions dan tanpa redirect `/api/*` (tidak ada server tier).
4. The system SHALL menyediakan migrasi `supabase/migrations/0001_init.sql` berisi skema Postgres, enum, fungsi `is_admin()`, RPC `submit_brief`, trigger signup, kebijakan RLS, dan kebijakan Storage.
5. The system SHALL menyediakan `.env.example` yang mendokumentasikan env var client-safe; injeksi ke browser via `env.js`.
6. WHEN situs di-deploy dengan custom domain THEN sistem SHALL melayani melalui HTTPS terkelola Netlify, dan custom domain serta URL deploy-preview SHALL ditambahkan ke allowed redirect/site URLs di Supabase Auth.

### Requirement 9: Pengembangan & Preview Lokal

**User Story:** Sebagai developer, saya ingin menjalankan situs secara lokal, agar bisa menguji sebelum deploy.

#### Acceptance Criteria
1. The system SHALL mendukung menjalankan situs lokal via static server biasa (mis. `npx serve`/`python -m http.server`); `netlify dev` opsional karena tidak ada functions.
2. The system SHALL mendukung stack Supabase lokal via `supabase start` dengan menerapkan `0001_init.sql`.
3. The system SHALL menyediakan `env.js` untuk konfigurasi `window.__ENV__` di lokal, dan `.env` (gitignored) untuk nilai sumbernya.
4. The system SHALL menyediakan unit test untuk fungsi murni dan property-based test untuk normalisasi & validasi.

## Pemetaan Correctness Property → Requirements

| Correctness Property (design.md) | Requirement |
|----------------------------------|-------------|
| 1. Public order submission integrity | 3.4, 3.8, 7.2 |
| 2. Secret isolation | 7.4, 7.5 |
| 3. Admin gate on mutations | 4.4, 5.4, 5.5, 7.3 |
| 4. Read isolation | 1.2, 7.2 |
| 5. Atomic order + customer insert | 3.4 |
| 6. Idempotent phone normalization | 3.2 |
