# Prompt Generate Gambar — LogoKu

Kumpulan prompt siap pakai untuk AI image/video generator (Midjourney, DALL·E, Ideogram, Leonardo, Flux, dll). Prompt sengaja ditulis dalam **bahasa Inggris** karena model gambar paling akurat dengan input Inggris. Keterangan tetap Indonesia.

---

## A. Galeri Desain Logo (9 gambar)

**Cara pakai:** generate tiap brand satu per satu. Ukuran **1:1 (square)**, latar **transparan** atau putih bersih supaya rapi saat ditaruh di kartu galeri. Hindari teks acak — kalau model menambah huruf yang salah, regenerate.

**Gaya dasar (tempel di akhir setiap prompt):**
```
flat vector brand logo, minimal, single clean mark, centered, geometric, premium, high contrast, smooth edges, on transparent background, no extra text, vector illustration, studio quality, 1:1
```

**1. Kopi Kenangan Senja** — Kuliner & Kafe
```
Logo for a cozy specialty coffee shop called "Kopi Kenangan Senja", a warm retro sunset arc combined with a coffee bean and a rising steam line, amber gold and burnt orange palette, vintage hand-crafted badge feeling, [gaya dasar]
```

**2. Roti Bahagia** — Kuliner & Kafe
```
Logo for a friendly neighborhood bakery "Roti Bahagia", soft rounded shapes forming a smiling loaf of bread or a wheat sheaf, cheerful coral pink and warm red palette, playful approachable mark, [gaya dasar]
```

**3. Teh Tarik Tariko** — Kuliner & Kafe
```
Logo for a modern tea brand "Teh Tariko", a fresh tea leaf merged with a rising pour/swirl line, emerald and deep green palette, traditional-meets-modern, calm and natural, [gaya dasar]
```

**4. Apex Holding Corp** — Corporate & Bisnis
```
Corporate logo for "Apex Holding", a strong geometric upward triangle / ascending peak forming the letter A, royal blue and indigo palette, stable trustworthy enterprise mark, sharp and confident, [gaya dasar]
```

**5. Nusantara Tech** — Corporate & Bisnis
```
Tech company logo for "Nusantara Tech", a precise hexagon network node forming the letter N, cyan and electric blue palette, connected-nodes / circuit feeling, futuristic and clean, [gaya dasar]
```

**6. Vertex Finance** — Corporate & Bisnis
```
Fintech logo for "Vertex Finance", a sharp diamond / shield shape forming the letter V, indigo and deep violet palette, secure and precise, premium financial mark, [gaya dasar]
```

**7. Purely Organics** — Minimalis & Modern
```
Beauty/skincare logo for "Purely Organics", elegant organic curved line forming a leaf and the letter P, fresh lime green and teal palette, feminine luxurious minimal, soft and natural, [gaya dasar]
```

**8. Aurora Studio** — Minimalis & Modern
```
Creative studio logo for "Aurora Studio", a smooth gradient orb / abstract aurora swirl forming the letter A, violet to purple gradient, modern artistic and fluid, [gaya dasar]
```

**9. Mono Architects** — Minimalis & Modern
```
Architecture firm logo for "Mono Architects", a precise monochrome square / structural grid forming the letter M, slate grey and soft white palette, minimalist refined and clean, [gaya dasar]
```

**Template untuk brand baru (tinggal isi kurung):**
```
Logo for a [JENIS BISNIS] called "[NAMA BRAND]", a [BENTUK/IKON UTAMA] forming the letter [HURUF], [WARNA] palette, [KESAN: mewah/playful/futuristik/dll], [gaya dasar]
```

---

## B. Logo Animasi (intro di awal halaman)

Logo monogram "LK" yang muncul saat halaman dibuka. Pilih salah satu jalur:

### Jalur 1 — AI Video Generator (Runway, Kling, Sora, Pika, Luma)
```
3 second elegant logo reveal animation. A glassy frosted 3D rounded-square monogram with the letters "LK" assembles from floating glass shards, then a soft light sweep glides across the surface. Deep dark violet background, violet-to-blue gradient glass, soft purple glow, subtle floating particles, premium and clean motion, gentle ease-in-out, slow rotation, cinematic lighting, looping, 16:9
```
Catatan: hasil video bisa di-export jadi **MP4/WebM** atau **GIF**, lalu dipasang di hero.

### Jalur 2 — Brief untuk Motion Designer / Lottie / After Effects
- **Durasi:** ±2.5 detik, lalu idle float halus (loop).
- **Tahap 1 (0–1s):** huruf "L" dan "K" slide masuk dari kiri & kanan, sedikit blur, lalu snap menyatu jadi monogram di dalam kartu kaca.
- **Tahap 2 (1–1.8s):** kartu kaca melakukan tilt 3D ringan (rotateY -15° → +15°), muncul kilau cahaya (light sweep) menyapu permukaan.
- **Tahap 3 (1.8s+):** idle — kartu mengambang naik-turun pelan (translateY ±8px, 4 dtk loop), glow violet berdenyut halus.
- **Warna:** gradient `#a78bfa → #60a5fa`, latar `#0a0816`, glow `rgba(124,58,237,.5)`.
- **Format ideal:** **Lottie JSON** (ringan, mulus, bisa di-loop di web).

### Jalur 3 — Prompt untuk AI coding (kalau mau animasi via kode)
```
Buatkan animasi intro CSS/Lottie untuk monogram "LK": kartu kaca (glassmorphism) berisi huruf LK gradient violet-biru, huruf masuk dari samping lalu menyatu, kilau cahaya menyapu sekali, lalu kartu mengambang naik-turun pelan secara loop. Background gelap violet, glow ungu lembut. Mulus dan premium.
```

> Catatan: di hero halaman sekarang **sudah ada** logo kaca 3D "LK" yang berputar pelan. Prompt di atas untuk kalau mau menggantinya dengan video/Lottie yang lebih sinematik.
