<?php
// Hubungkan ke konfigurasi database
require_once 'config/database.php';

// Mengambil data kategori untuk filter dinamis
$categories = [];
$catalogs = [];

if (isset($pdo)) {
    try {
        $stmt_cat = $pdo->query("SELECT * FROM categories");
        if ($stmt_cat) $categories = $stmt_cat->fetchAll();

        $stmt_catg = $pdo->query("SELECT c.*, cat.category_name, cat.slug AS cat_slug FROM catalogs c LEFT JOIN categories cat ON c.category_id = cat.id ORDER BY c.id DESC");
        if ($stmt_catg) $catalogs = $stmt_catg->fetchAll();
    } catch (PDOException $e) {
        // Fallback jika database belum siap
    }
}

// Load komponen header (Brand LogoKu otomatis menyesuaikan di sini)
include_once 'includes/header.php';
?>

<!-- 1. HERO SECTION (Premium & Clean) -->
<section class="hero-section">
    <div class="hero-content">
        <span class="badge">🚀 Jasa Pembuatan Logo & Branding No. 1</span>
        <h1>Bikin Identitas Brand Bisnismu <span class="text-gradient">Terlihat Profesional</span></h1>
        <p>LogoKu membantu UMKM hingga Perusahaan Besar menciptakan logo ikonik, elegan, dan memiliki filosofi kuat. Cukup pilih referensi gaya di bawah, pesan instan via WhatsApp tanpa ribet.</p>
        <div class="hero-cta">
            <a href="#katalog" class="btn-primary">Lihat Katalog Desain</a>
            <a href="https://api.whatsapp.com/send?phone=6285236314038&text=Halo%20Admin%20LogoKu,%20saya%20ingin%20berkonsultasi%20mengenai%20desain%20logo." target="_blank" class="btn-secondary">Konsultasi Desain Gratis</a>
        </div>
    </div>
    <div class="hero-image">
        <!-- Struktur Grafis Vektor Minimalis modern -->
        <div class="mockup-box">
            <div class="mockup-circle">
                <div class="inner-logo-text">LK</div>
            </div>
            <div class="mockup-badge">✓ Top Agency</div>
            <div class="mockup-badge-left">100% Original</div>
        </div>
    </div>
</section>

<!-- 2. STATISTIK & BENEFIT SECTION -->
<section class="benefit-section">
    <div class="container grid-3">
        <div class="benefit-card">
            <div class="icon-box">🎨</div>
            <h3>Desain 100% Eksklusif</h3>
            <p>Bukan template pasaran. Logo Anda diriset khusus sesuai karakter bisnis Anda.</p>
        </div>
        <div class="benefit-card">
            <div class="icon-box">⚡</div>
            <h3>Proses Super Cepat</h3>
            <p>Dapatkan draf konsep sketsa pertama dalam waktu 1-3 hari kerja.</p>
        </div>
        <div class="benefit-card">
            <div class="icon-box">💬</div>
            <h3>Pantau Lewat Sistem & WA</h3>
            <p>Kemudahan revisi interaktif langsung tanpa ribet membuat akun manual.</p>
        </div>
    </div>
</section>

<!-- 3. KATALOG & PORTFOLIO SECTION -->
<section id="katalog" class="catalog-section">
    <div class="section-header">
        <h2>Contoh Desain Company Profile yang Pernah Kami Kerjakan</h2>
        <p>Klik tombol "Gunakan Gaya Ini" pada logo yang paling mendekati selera bisnis Anda.</p>
    </div>

    <!-- Filter Kategori Dinamis -->
    <div class="catalog-filter">
        <button class="filter-btn active" data-filter="all">Semua Kategori</button>
        <?php if (!empty($categories)): ?>
            <?php foreach ($categories as $cat): ?>
                <button class="filter-btn" data-filter="<?= htmlspecialchars($cat['slug']); ?>">
                    <?= htmlspecialchars($cat['category_name']); ?>
                </button>
            <?php endforeach; ?>
        <?php else: ?>
            <!-- Fallback Filter jika DB masih proses sinkronisasi -->
            <button class="filter-btn" data-filter="kuliner-kafe">Kuliner & Kafe</button>
            <button class="filter-btn" data-filter="corporate-bisnis">Corporate & Bisnis</button>
            <button class="filter-btn" data-filter="minimalis-modern">Minimalis & Modern</button>
        <?php endif; ?>
    </div>

    <!-- Grid Item Katalog -->
    <div class="catalog-grid" id="catalogGrid">
        <?php if (empty($catalogs)): ?>
            <!-- Data Dummy Statis Berstandar Premium -->
            <div class="catalog-item" data-category="kuliner-kafe">
                <div class="img-placeholder">☕ Logo Kopi Kenangan Senja</div>
                <div class="catalog-info">
                    <span class="item-badge">Kuliner & Kafe</span>
                    <h3>Kopi Kenangan Senja</h3>
                    <p class="item-desc">Tipografi hangat dengan ikon retro estetik. Sangat cocok untuk kedai kopi kekinian.</p>
                    <a href="brief.php?ref=1" class="btn-use-ref">Gunakan Gaya Ini</a>
                </div>
            </div>
            <div class="catalog-item" data-category="corporate-bisnis">
                <div class="img-placeholder">🏢 Logo Apex Group</div>
                <div class="catalog-info">
                    <span class="item-badge">Corporate & Bisnis</span>
                    <h3>Apex Holding Corp</h3>
                    <p class="item-desc">Geometris, kokoh, melambangkan pertumbuhan bisnis yang stabil dan tepercaya.</p>
                    <a href="brief.php?ref=2" class="btn-use-ref">Gunakan Gaya Ini</a>
                </div>
            </div>
            <div class="catalog-item" data-category="minimalis-modern">
                <div class="img-placeholder">🌱 Logo Purely Skincare</div>
                <div class="catalog-info">
                    <span class="item-badge">Minimalis & Modern</span>
                    <h3>Purely Organics</h3>
                    <p class="item-desc">Sentuhan garis organik feminin mewah, sangat ideal untuk kosmetik dan kecantikan.</p>
                    <a href="brief.php?ref=3" class="btn-use-ref">Gunakan Gaya Ini</a>
                </div>
            </div>
        <?php else: ?>
            <!-- Render Otomatis dari Panel Admin MySQL -->
            <?php foreach ($catalogs as $row): ?>
                <div class="catalog-item" data-category="<?= htmlspecialchars($row['cat_slug'] ?? 'all'); ?>">
                    <img src="uploads/catalog/<?= htmlspecialchars($row['image_url']); ?>" alt="<?= htmlspecialchars($row['title']); ?>">
                    <div class="catalog-info">
                        <span class="item-badge"><?= htmlspecialchars($row['category_name'] ?? 'General'); ?></span>
                        <h3><?= htmlspecialchars($row['title']); ?></h3>
                        <p class="item-desc"><?= htmlspecialchars($row['description']); ?></p>
                        <a href="brief.php?ref=<?= $row['id']; ?>" class="btn-use-ref">Gunakan Gaya Ini</a>
                    </div>
                </div>
            <?php endforeach; ?>
        <?php endif; ?>
    </div>
</section>

<!-- 4. ALUR PEMESANAN (CARA KERJA) -->
<section id="cara-kerja" class="workflow-section">
    <div class="section-header">
        <h2>3 Langkah Mudah Pesan Logo</h2>
        <p>Proses integrasi instan tanpa ribet isi form berlembar-lembar</p>
    </div>
    <div class="container grid-3">
        <div class="step-card">
            <div class="step-number">01</div>
            <h4>Pilih Referensi</h4>
            <p>Cari inspirasi gaya logo kesukaanmu di galeri katalog LogoKu di atas.</p>
        </div>
        <div class="step-card">
            <div class="step-number">02</div>
            <h4>Isi Brief Kreatif</h4>
            <p>Verifikasi nomor WhatsApp, lalu isi nama brand dan preferensi warna lewat asisten bot kami.</p>
        </div>
        <div class="step-card">
            <div class="step-number">03</div>
            <h4>Terima & Evaluasi</h4>
            <p>Pantau progres pembuatan desain langsung dari website, revisi langsung di tempat hingga final.</p>
        </div>
    </div>
</section>

<!-- 5. PRICING SECTION (Daftar Paket Harga) -->
<section id="harga" class="pricing-section">
    <div class="section-header">
        <h2>Paket Harga Jasa Desain Logo</h2>
        <p>Pilih paket investasi terbaik untuk branding bisnis masa depan Anda</p>
    </div>

    <div class="container pricing-grid">
        <!-- Paket 1 -->
        <div class="pricing-card">
            <div class="pricing-header">
                <h3>Logo 1 Pilihan</h3>
                <p class="pricing-subtitle">Konsep dari Pemesan</p>
                <div class="price">Rp <span>80</span>.000</div>
            </div>
            <ul class="pricing-features">
                <li class="check">Logo 1 Desain</li>
                <li class="check">Revisi 3x</li>
                <li class="check">1-3 Hari</li>
                <li class="check">File Master CDR/AI/EPS</li>
                <li class="check">Panduan Warna</li>
                <li class="cross">Pedoman Merek</li>
                <li class="check">Logo Arti</li>
                <li class="cross">Kartu Nama</li>
                <li class="cross">Amplop & Kop Surat</li>
                <li class="cross">Bonus 4 Identitas Desian</li>
                <li class="check">Ekspor JPG / PNG / PDF</li>
            </ul>
            <a href="brief.php?paket=1" class="btn-pricing">Pilih Paket <i class="fab fa-whatsapp"></i></a>
        </div>

        <!-- Paket 2 -->
        <div class="pricing-card">
            <div class="pricing-header">
                <h3>Logo 2 Pilihan</h3>
                <p class="pricing-subtitle">2 Desain Alternatif</p>
                <div class="price">Rp <span>140</span>.000</div>
            </div>
            <ul class="pricing-features">
                <li class="check">Logo 2 Pilihan</li>
                <li class="check">Revisi 3x</li>
                <li class="check">1-2 Hari</li>
                <li class="check">File Master CDR/AI/EPS</li>
                <li class="check">Panduan Warna</li>
                <li class="cross">Pedoman Merek</li>
                <li class="check">Logo Arti</li>
                <li class="check">Kartu Nama</li>
                <li class="cross">Amplop & Kop Surat</li>
                <li class="cross">Bonus 4 Identitas Desian</li>
                <li class="check">Ekspor JPG / PNG / PDF</li>
            </ul>
            <a href="brief.php?paket=2" class="btn-pricing">Pilih Paket <i class="fab fa-whatsapp"></i></a>
        </div>

        <!-- Paket 3 (Terlaris) -->
        <div class="pricing-card featured">
            <div class="ribbon-badge">TERLARIS</div>
            <div class="pricing-header">
                <h3>Logo 3 Pilihan</h3>
                <p class="pricing-subtitle">3 Alternatif Desain</p>
                <div class="price">Rp <span>199</span>.000</div>
            </div>
            <ul class="pricing-features">
                <li class="check">Logo 3 Pilihan</li>
                <li class="check">Revisi 3x</li>
                <li class="check">1-2 Hari</li>
                <li class="check">File Master CDR/AI/EPS</li>
                <li class="check">Panduan Warna</li>
                <li class="cross">Pedoman Merek</li>
                <li class="check">Logo Arti</li>
                <li class="check">Kartu Nama</li>
                <li class="check">Amplop & Kop</li>
                <li class="cross">Bonus 4 Identitas Desian</li>
                <li class="check">Ekspor JPG / PNG / PDF</li>
            </ul>
            <a href="brief.php?paket=3" class="btn-pricing">Pilih Paket <i class="fab fa-whatsapp"></i></a>
        </div>

        <!-- Paket 4 (Terlengkap) -->
        <div class="pricing-card featured-premium">
            <div class="ribbon-badge premium">TERLENGKAP</div>
            <div class="pricing-header">
                <h3>Paket Utama</h3>
                <p class="pricing-subtitle">Paket Lengkap</p>
                <div class="price">Rp <span>250</span>.000</div>
            </div>
            <ul class="pricing-features">
                <li class="check">Logo 4 Pilihan</li>
                <li class="check">Revisi 3x</li>
                <li class="check">1-7 Hari</li>
                <li class="check">File Master CDR/AI/EPS</li>
                <li class="check">Panduan Warna</li>
                <li class="check">Pedoman Merek</li>
                <li class="check">Logo Arti</li>
                <li class="check">Kartu Nama</li>
                <li class="check">Amplop & Kop</li>
                <li class="check">Bonus 4 Identitas Desian</li>
                <li class="check">Ekspor JPG / PNG / PDF</li>
            </ul>
            <a href="brief.php?paket=4" class="btn-pricing">Pilih Paket <i class="fab fa-whatsapp"></i></a>
        </div>
    </div>
</section>

<!-- 5. TESTIMONI SECTION -->
<section id="testimoni" class="workflow-section" style="background-color: var(--bg-secondary);">
    <div class="section-header">
        <h2>Apa Kata Klien Kami?</h2>
        <p>Kami bangga telah membantu ratusan brand tumbuh dan terlihat profesional.</p>
    </div>
    <div class="container grid-3">
        <!-- Contoh Testimoni 1 -->
        <div class="benefit-card">
            <p>"Desainnya melebihi ekspektasi! Tim LogoKu sangat responsif dan cepat mengerti brief yang saya berikan. Sangat direkomendasikan."</p>
            <h4 style="margin-top: 20px; font-size: 16px;">- Budi Santoso, CEO Kopi Senja</h4>
        </div>
        <!-- Contoh Testimoni 2 -->
        <div class="benefit-card">
            <p>"Prosesnya mudah dan hasilnya luar biasa. Logo baru kami terlihat jauh lebih modern dan profesional. Terima kasih LogoKu!"</p>
            <h4 style="margin-top: 20px; font-size: 16px;">- Rina Wijaya, Owner Purely Organics</h4>
        </div>
        <!-- Contoh Testimoni 3 -->
        <div class="benefit-card">
            <p>"Sistem tracking project-nya sangat membantu. Saya bisa memantau progres desain kapan saja. Pelayanan yang sangat memuaskan."</p>
            <h4 style="margin-top: 20px; font-size: 16px;">- Alex T., Apex Holding</h4>
        </div>
    </div>
</section>

<!-- 6. FAQ SECTION -->
<section id="faq" class="workflow-section">
    <div class="section-header">
        <h2>Pertanyaan yang Sering Diajukan (FAQ)</h2>
        <p>Tidak menemukan jawaban? Hubungi kami langsung untuk konsultasi gratis.</p>
    </div>
    <div class="container faq-container">
        <!-- FAQ Item 1 -->
        <div class="faq-item">
            <button class="faq-question">
                <span>Berapa lama proses pengerjaan logo?</span>
                <span class="faq-icon">+</span>
            </button>
            <div class="faq-answer">
                <p>Proses desain konsep awal biasanya memakan waktu 1-3 hari kerja setelah brief kami terima. Durasi total proyek sangat bergantung pada jumlah revisi dan kecepatan feedback dari Anda.</p>
            </div>
        </div>
        <!-- FAQ Item 2 -->
        <div class="faq-item">
            <button class="faq-question">
                <span>Apa saja yang akan saya dapatkan di paket akhir?</span>
                <span class="faq-icon">+</span>
            </button>
            <div class="faq-answer">
                <p>Anda akan menerima file master logo dalam berbagai format (AI, EPS, PDF) untuk keperluan cetak, serta format web (PNG, JPG, SVG) dengan latar belakang transparan dan solid. Anda juga akan mendapatkan panduan singkat penggunaan logo.</p>
            </div>
        </div>
        <!-- FAQ Item 3 -->
        <div class="faq-item">
            <button class="faq-question">
                <span>Bagaimana jika saya tidak suka dengan desainnya?</span>
                <span class="faq-icon">+</span>
            </button>
            <div class="faq-answer">
                <p>Setiap paket kami menyertakan jumlah revisi tertentu. Kami akan bekerja sama dengan Anda untuk menyempurnakan desain hingga sesuai dengan visi Anda. Kepuasan Anda adalah prioritas utama kami.</p>
            </div>
        </div>
    </div>
</section>

<?php
// Load komponen footer
include_once 'includes/footer.php';
?>