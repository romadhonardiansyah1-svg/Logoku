<?php
// 1. Inisialisasi Session dan Hubungkan ke Database
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Pastikan jalur (path) menuju database.php benar. 
// Karena file ini ada di dalam folder 'core', kita gunakan '../' untuk naik satu folder.
require_once '../config/database.php';

// Pastikan request datang dari method POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header("Location: ../index.php");
    exit();
}

// 2. Ambil dan Bersihkan Data Input
$whatsapp_number         = isset($_POST['whatsapp_number']) ? trim(htmlspecialchars($_POST['whatsapp_number'])) : '';
$full_name               = isset($_POST['full_name']) ? trim(htmlspecialchars($_POST['full_name'])) : '';
$paket_pilihan           = !empty($_POST['paket_pilihan']) ? intval($_POST['paket_pilihan']) : NULL;
$brand_name              = isset($_POST['brand_name']) ? trim(htmlspecialchars($_POST['brand_name'])) : '';
$tagline                 = isset($_POST['tagline']) ? trim(htmlspecialchars($_POST['tagline'])) : '';
$brand_description       = isset($_POST['brand_description']) ? trim(htmlspecialchars($_POST['brand_description'])) : '';
$logo_style_notes        = isset($_POST['logo_style_notes']) ? trim(htmlspecialchars($_POST['logo_style_notes'])) : '';
$reference_catalog_id    = !empty($_POST['reference_catalog_id']) ? intval($_POST['reference_catalog_id']) : NULL;

// Ambil data dari color picker baru dan format untuk disimpan
$primary_color           = isset($_POST['primary_color']) ? htmlspecialchars($_POST['primary_color']) : '#000000';
$secondary_color         = isset($_POST['secondary_color']) ? htmlspecialchars($_POST['secondary_color']) : '#FFFFFF';
$color_preferences       = "Dominan: {$primary_color}, Sekunder: {$secondary_color}";

// Validasi input wajib
if (empty($whatsapp_number) || empty($full_name) || empty($brand_name) || empty($brand_description)) {
    $_SESSION['error_message'] = "Error: Mohon lengkapi semua data wajib yang bertanda bintang (*).";
    header("Location: ../brief.php");
    exit();
}

// Standarisasi nomor WhatsApp ke format 62xxx
if (substr($whatsapp_number, 0, 1) === '0') {
    $whatsapp_number = '62' . substr($whatsapp_number, 1);
} elseif (substr($whatsapp_number, 0, 2) !== '62') {
    $whatsapp_number = '62' . $whatsapp_number;
}

try {
    $pdo->beginTransaction();

    // 3. LOGIKA USER (ZERO-LOGIN): Cek apakah nomor WA sudah terdaftar
    $stmt_user = $pdo->prepare("SELECT id FROM users WHERE whatsapp_number = ? LIMIT 1");
    $stmt_user->execute([$whatsapp_number]);
    $user = $stmt_user->fetch();

    if ($user) {
        // Jika user sudah ada, update namanya jika berbeda
        $user_id = $user['id'];
        $stmt_update_user = $pdo->prepare("UPDATE users SET full_name = ? WHERE id = ?");
        $stmt_update_user->execute([$full_name, $user_id]);
    } else {
        // Jika user baru, buat entri baru
        $stmt_insert_user = $pdo->prepare("INSERT INTO users (whatsapp_number, full_name, role) VALUES (?, ?, 'client')");
        $stmt_insert_user->execute([$whatsapp_number, $full_name, 'client']);
        $user_id = $pdo->lastInsertId();
    }

    // 4. SIMPAN DATA PESANAN BARU (ORDERS)
    // Kolom disesuaikan 100% dengan database baru Anda
    $sql_order = "INSERT INTO orders (
                    client_id, package_id, reference_catalog_id, brand_name, tagline, 
                    brand_description, preferred_colors, logo_style_notes, status, created_at
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())";

    $stmt_order = $pdo->prepare($sql_order);
    $stmt_order->execute([
        $user_id,
        $paket_pilihan,
        $reference_catalog_id,
        $brand_name,
        $tagline,
        $brand_description,
        $color_preferences,
        $logo_style_notes
    ]);

    // Ambil ID dari pesanan yang BARU SAJA dimasukkan
    $order_id = $pdo->lastInsertId();

    // Buat nomor order unik SETELAH pesanan berhasil disimpan
    $order_number = "LKU-" . date('Y') . "-" . str_pad($order_id, 4, '0', STR_PAD_LEFT);
    $pdo->exec("UPDATE orders SET order_number = '$order_number' WHERE id = $order_id");

    $pdo->commit();

    // 5. SEAMLESS REDIRECT KE WHATSAPP ADMIN
    $pesan_wa = "Halo Admin LogoKu! Saya telah mengisi brief pesanan baru.\n\n";
    $pesan_wa .= "*[ Data Pesanan ]*\n";
    $pesan_wa .= "• No Order: " . $order_number . "\n";
    $pesan_wa .= "• Nama Klien: " . $full_name . "\n";
    $pesan_wa .= "• No WA: +" . $whatsapp_number . "\n";
    $pesan_wa .= "• Nama Brand: " . $brand_name . "\n";
    $pesan_wa .= "• Preferensi Warna: " . $color_preferences . "\n\n";
    $pesan_wa .= "Mohon segera diproses. Terima kasih!";

    $encoded_message = urlencode($pesan_wa);
    $nomor_admin_wa = "6285236314038"; // Nomor WA Admin

    $whatsapp_url = "https://api.whatsapp.com/send?phone=" . $nomor_admin_wa . "&text=" . $encoded_message;

    // Alihkan pengguna secara otomatis ke WhatsApp
    header("Location: " . $whatsapp_url);
    exit();
} catch (PDOException $e) {
    // Jika ada yang error, batalkan semua transaksi agar database tidak korup
    $pdo->rollBack();
    $_SESSION['error_message'] = "Gagal menyimpan data! Pesan Error: " . $e->getMessage();
    header("Location: ../brief.php");
    exit();
}
