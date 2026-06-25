<?php
// Hubungkan ke database dan mulai session
require_once 'config/database.php';

// Menangkap id referensi katalog atau id paket harga jika ada
$ref_id = isset($_GET['ref']) ? htmlspecialchars($_GET['ref']) : '';
$paket_id = isset($_GET['paket']) ? htmlspecialchars($_GET['paket']) : '';

// Ambil info nama paket untuk ditampilkan di formulir secara otomatis
$nama_paket = "";
if ($paket_id == '1') $nama_paket = "Logo 1 Pilihan (Rp 80.000)";
if ($paket_id == '2') $nama_paket = "Logo 2 Pilihan (Rp 140.000)";
if ($paket_id == '3') $nama_paket = "Logo 3 Pilihan - Terlaris (Rp 199.000)";
if ($paket_id == '4') $nama_paket = "Paket Utama - Lengkap (Rp 250.000)";

include_once 'includes/header.php';
?>

<div class="brief-container">
    <div class="brief-header">
        <h2>Mulai Proyek Logo Anda ⚡</h2>
        <p>Isi data singkat di bawah ini. Nomor WhatsApp Anda akan digunakan sebagai akses masuk instan untuk memantau progres desain.</p>
    </div>

    <form action="core/order-handler.php" method="POST" class="brief-form">
        <input type="hidden" name="reference_catalog_id" value="<?php echo $ref_id; ?>">

        <div class="form-section">
            <div class="section-title"><span>1</span> Informasi Kontak & Verifikasi</div>

            <div class="form-group">
                <label for="whatsapp_number">Nomor WhatsApp Aktif</label>
                <div class="input-prefix-box">
                    <span class="prefix">+62</span>
                    <input type="tel" id="whatsapp_number" name="whatsapp_number" placeholder="81234567xxx" required>
                </div>
                <small>Kode verifikasi OTP akan dikirimkan ke nomor ini untuk validasi akses keamanan.</small>
            </div>

            <div class="form-group">
                <label for="full_name">Nama Lengkap Anda</label>
                <input type="text" id="full_name" name="full_name" placeholder="Masukkan nama panggilan atau nama terang" required>
            </div>
        </div>

        <div class="form-section">
            <div class="section-title"><span>2</span> Spesifikasi & Brief Kreatif Logo</div>

            <?php if (!empty($nama_paket)): ?>
                <div class="form-group">
                    <label>Paket yang Dipilih</label>
                    <input type="text" class="input-disabled" value="<?php echo $nama_paket; ?>" readonly>
                    <input type="hidden" name="paket_pilihan" value="<?php echo $paket_id; ?>">
                </div>
            <?php endif; ?>

            <div class="form-group">
                <label for="brand_name">Nama Brand / Bisnis</label>
                <input type="text" id="brand_name" name="brand_name" placeholder="Contoh: Kopi Kenangan Senja, Siberia Tech" required>
            </div>

            <div class="form-group">
                <label for="tagline">Slogan / Tagline Bisnis <span class="optional">(Opsional)</span></label>
                <input type="text" id="tagline" name="tagline" placeholder="Contoh: Rasakan Kehangatan di Setiap Tegukan">
            </div>

            <div class="form-group">
                <label for="brand_description">Deskripsi Bisnis & Target Pasar</label>
                <textarea id="brand_description" name="brand_description" rows="4" placeholder="Jelaskan bisnis Anda bergerak di bidang apa dan siapa target konsumen utamanya (anak muda, korporat, wanita, dll)." required></textarea>
            </div>

            <div class="form-group">
                <label for="primary_color">Warna Dominan</label>
                <div class="color-input-wrapper">
                    <input type="color" id="primary_color" name="primary_color" value="#3b82f6">
                    <input type="text" id="primary_color_hex" value="#3b82f6" readonly>
                </div>
                <small>Pilih warna utama yang paling mewakili brand Anda.</small>
            </div>

            <div class="form-group">
                <label for="secondary_color">Warna Sekunder <span class="optional">(Opsional)</span></label>
                <div class="color-input-wrapper">
                    <input type="color" id="secondary_color" name="secondary_color" value="#e5e7eb">
                    <input type="text" id="secondary_color_hex" value="#e5e7eb" readonly>
                </div>
                <small>Pilih warna pendamping jika diperlukan.</small>
            </div>

            <div class="form-group">
                <label for="logo_style_notes">Catatan Gaya / Permintaan Khusus <span class="optional">(Opsional)</span></label>
                <textarea id="logo_style_notes" name="logo_style_notes" rows="3" placeholder="Contoh: Saya ingin logonya minimalis menggunakan ikon daun, hindari font yang terlalu kaku."></textarea>
            </div>
        </div>

        <button type="submit" class="btn-submit-brief">Kirim Data & Dapatkan Kode Akses WA ➔</button>
    </form>
</div>

<?php
include_once 'includes/footer.php';
?>