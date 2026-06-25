<?php
// Mengaktifkan session untuk melacak login nomor WhatsApp pelanggan nanti
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Pengaturan Konfigurasi Database MySQL
define('DB_HOST', 'localhost');
define('DB_USER', 'root');      // Default user XAMPP adalah root
define('DB_PASS', '');          // Default password XAMPP adalah kosong
define('DB_NAME', 'db_jasa_logo'); // Nama database yang kita buat di phpMyAdmin

try {
    // Membuat koneksi menggunakan PDO (PHP Data Objects) yang lebih aman dari SQL Injection
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);

    // Mengatur error mode ke Exception agar jika ada error/salah ketik tabel langsung ketahuan
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Mengatur mode fetch bawaan menjadi Array Asosiatif agar mudah dipanggil kodenya
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    // Jika koneksi gagal, biarkan $pdo tidak terdefinisi agar halaman
    // tetap tampil dengan data fallback (mode preview tanpa MySQL).
    // Hapus baris di bawah untuk produksi jika ingin menampilkan error.
    $pdo = null;
    error_log("Koneksi ke database gagal: " . $e->getMessage());
}
