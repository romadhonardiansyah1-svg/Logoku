# Implementation Plan: LogoKu — Netlify + Supabase Re-architecture

## Overview

Rencana implementasi membangun ulang LogoKu dari PHP/MySQL menjadi situs statis murni di Netlify + Supabase (tanpa server tier, tanpa OTP, pemesanan via wa.me langsung). Pekerjaan dimulai dari pondasi (struktur proyek, skema database + RLS, modul bersama), lalu keempat halaman frontend hasil redesign, pengujian, dan dokumentasi deploy. Tugas disusun agar dependensi terpenuhi.

## Tasks

- [x] 1. Inisialisasi struktur proyek & arsip legacy
- [x] 1.1 Pindahkan seluruh berkas PHP/SQL/includes/core/admin lama ke `_legacy/`
  - Diarsipkan: index.php, brief.php, admin/, core/, config/, includes/, assets/ lama.
  - _Requirements: 8.2_
- [x] 1.2 Buat scaffolding direktori target (assets/css, assets/js/lib, supabase/migrations, tests)
  - _Requirements: 8.1_
- [x] 1.3 Buat `package.json`, `netlify.toml`, `.env.example`, `.gitignore`, `env.js`/`env.example.js`
  - _Requirements: 8.1, 8.3, 8.5, 9.3_

- [x] 2. Skema database & RLS Supabase
- [x] 2.1 Tulis migrasi `supabase/migrations/0001_init.sql` (tabel, enum, index)
  - _Requirements: 8.4_
- [x] 2.2 Fungsi `is_admin()`, trigger `handle_new_user`, RPC `submit_brief`, kebijakan RLS
  - _Requirements: 7.1, 7.2, 7.3, 4.2, 3.4_
- [x] 2.3 Kebijakan Storage `catalog-images` (publik baca/admin tulis) & `payment-proofs` (privat)
  - _Requirements: 6.2, 6.4_
- [x] 2.4 Seed data contoh (`supabase/seed.sql`)
  - _Requirements: 1.4_

- [x] 3. Modul bersama frontend
- [x] 3.1 `lib/supabaseClient.js` (anon, dari `window.__ENV__`, supabase-js via CDN) + `catalogImageUrl`
  - _Requirements: 7.4, 7.5, 6.3_
- [x] 3.2 `lib/wa.js` — `buildWaHandoff` / `buildWaConsult` (fungsi murni)
  - _Requirements: 3.6, 5.6, 1.6_
- [x] 3.3 `lib/orders.js` — `validateBrief` + `submitBrief` (RPC, tanpa server tier)
  - _Requirements: 3.3, 3.4, 3.5, 3.8_
- [x] 3.4 `lib/phone.js` — `normalizePhone` (murni, idempoten) + `lib/admin.js` (CRUD via RLS)
  - _Requirements: 3.2, 5.2, 5.4, 5.5, 5.7_

- [x] 4. Halaman Landing (`index.html` + `catalog.js` + `main.js`)
- [x] 4.1 Konversi `Landing.dc.html` ke `index.html` statis (tema 3D glass via `app.css`)
  - _Requirements: 1.1, 2.1_
- [x] 4.2 `catalog.js` — ambil kategori+katalog dari Supabase, render grid, filter, fallback statis
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 6.3_
- [x] 4.3 `main.js` — nav mobile, FAQ accordion, tautan WA; tombol paket → `brief.html?paket=<n>`
  - _Requirements: 2.2, 1.6_

- [x] 5. Halaman Brief (`brief.html` + `brief.js`)
- [x] 5.1 Konversi `Brief.dc.html` ke `brief.html` (2 langkah, color picker, honeypot, tanpa OTP)
  - _Requirements: 3.1, 3.7_
- [x] 5.2 `brief.js` — validasi → `submitBrief` → handoff `wa.me` (fallback preview tanpa backend)
  - _Requirements: 3.2, 3.3, 3.4, 3.6_

- [x] 6. Halaman Auth (`login.html` + `auth.js`)
- [x] 6.1 Konversi `Login.dc.html` ke `login.html` (tab Masuk/Daftar)
  - _Requirements: 4.1, 4.2_
- [x] 6.2 `auth.js` — login, register (signUp + info pending), reset sandi, role gate, logout
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 7. Halaman Dashboard (`dashboard.html` + `dashboard.js`)
- [x] 7.1 Konversi `Dashboard.dc.html` ke `dashboard.html` (sidebar, kartu, tabel, modal, toast)
  - _Requirements: 5.1_
- [x] 7.2 `dashboard.js` — role gate, baca orders/customers (RLS), stats & distribusi
  - _Requirements: 4.4, 4.6, 5.1, 5.2_
- [x] 7.3 Filter tabel, modal pesanan manual (create/edit), delete, validasi dp<=total, toast
  - _Requirements: 5.3, 5.4, 5.5, 5.7_
- [x] 7.4 Aksi chat (WA pelanggan) & form pengaturan profil
  - _Requirements: 5.6, 5.8_

- [x] 8. Pengujian
- [x] 8.1 Setup Vitest + fast-check (`vitest.config.js`)
  - _Requirements: 9.4_
- [x] 8.2 Unit + property test: `normalizePhone`, `buildWaHandoff`, `validateBrief`, `validateAmounts`
  - _Requirements: 3.2, 3.3, 3.6, 5.7_

- [x] 9. Deploy & dokumentasi
- [x] 9.1 `README.md`: arsitektur, setup Supabase + migrasi, env, run lokal, test
  - _Requirements: 8.6, 9.1, 9.2_
- [x] 9.2 Dokumentasi custom domain (DNS + HTTPS) dan allowed redirect URL Supabase Auth
  - _Requirements: 8.6_

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"], "dependsOn": [] },
    { "wave": 2, "tasks": ["2", "3"], "dependsOn": ["1"] },
    { "wave": 3, "tasks": ["4", "5", "6", "7"], "dependsOn": ["2", "3"] },
    { "wave": 4, "tasks": ["8"], "dependsOn": ["3"] },
    { "wave": 5, "tasks": ["9"], "dependsOn": ["1", "2", "3", "4", "5", "6", "7", "8"] }
  ]
}
```

```
1 (struktur+legacy)
├── 2 (skema DB & RLS)        depends on 1
├── 3 (modul lib frontend)    depends on 1
├── 4 (Landing)               depends on 2, 3
├── 5 (Brief)                 depends on 3
├── 6 (Auth)                  depends on 2, 3
├── 7 (Dashboard)             depends on 2, 3
├── 8 (Pengujian)             depends on 3
└── 9 (Deploy & dokumentasi)  depends on 1–8
```

## Notes

- Netlify tidak menjalankan PHP; seluruh kode PHP diarsipkan ke `_legacy/`, tidak dihapus.
- Tidak ada server tier / Netlify Functions / OTP. Pemesanan = chat `wa.me` langsung.
- Penyimpanan order publik lewat RPC `submit_brief` (SECURITY DEFINER) — anon tidak punya akses SELECT/UPDATE/DELETE pada orders/customers.
- Hanya nilai client-safe di browser (SUPABASE_URL, SUPABASE_ANON_KEY, ADMIN_WHATSAPP_NUMBER); tidak ada service-role key.
- Custom domain, env var produksi, dan migrasi Supabase dieksekusi di akun Netlify/Supabase milik pengguna (didokumentasikan di README).
