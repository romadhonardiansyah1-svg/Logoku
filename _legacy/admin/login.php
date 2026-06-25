<?php
// 1. Inisialisasi Session untuk Keamanan Login
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Jika admin terdeteksi sudah login sebelumnya, langsung lempar ke dashboard admin
if (isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true) {
    header("Location: dashboard.php");
    exit();
}

// Hubungkan ke file konfigurasi database (Naik 1 folder ke luar admin/)
require_once '../config/database.php';

$error_message = '';

// 2. LOGIKA BACKEND: Validasi Login via Database MySQL
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Ambil dan bersihkan input dari form
    $username_input = isset($_POST['username']) ? trim(htmlspecialchars($_POST['username'])) : '';
    $password_input = isset($_POST['password']) ? $_POST['password'] : '';

    if (!empty($username_input) && !empty($password_input)) {
        try {
            // Cari user berdasarkan username dan pastikan role-nya adalah 'admin' atau 'owner'
            // (Sesuaikan nama kolom 'username' dan 'role' dengan struktur tabel 'users' milikmu)
            $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? AND role = 'admin' LIMIT 1");
            $stmt->execute([$username_input]);
            $admin = $stmt->fetch();

            if ($admin) {
                // Verifikasi Password menggunakan password_verify() demi keamanan enkripsi
                // Catatan: Pastikan di DB password-nya sudah di-hash. Jika masih teks biasa, gunakan: if($password_input === $admin['password'])
                if (password_verify($password_input, $admin['password'])) {

                    // Set Session Sukses Login Admin
                    $_SESSION['admin_logged_in'] = true;
                    $_SESSION['admin_id']        = $admin['id'];
                    $_SESSION['admin_username']  = $admin['username'];
                    $_SESSION['admin_name']      = $admin['full_name'] ?? 'Admin';

                    // Alihkan ke Dashboard Admin
                    header("Location: dashboard.php");
                    exit();
                } else {
                    $error_message = 'Password yang Anda masukkan salah!';
                }
            } else {
                $error_message = 'Akun Admin tidak ditemukan atau Anda tidak memiliki hak akses!';
            }
        } catch (PDOException $e) {
            $error_message = 'Terjadi kesalahan database: ' . $e->getMessage();
        }
    } else {
        $error_message = 'Username dan Password wajib diisi!';
    }
}
?>
<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login Admin - LogoKu</title>

    <!-- EMBEDDED CSS (Gaya Tampilan Satu File) -->
    <style>
        * {
            box-sizing: border-box;
            font-family: 'Plus Jakarta Sans', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }

        body {
            background: #f4f7f6;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
        }

        .login-container {
            background-color: #ffffff;
            width: 100%;
            max-width: 400px;
            padding: 40px 30px;
            border-radius: 16px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
            border: 1px solid #e2e8f0;
        }

        .brand-header {
            text-align: center;
            margin-bottom: 30px;
        }

        .brand-header h2 {
            margin: 0;
            font-size: 24px;
            color: #1e293b;
            font-weight: 700;
        }

        .brand-header h2 span {
            color: #3b82f6;
            /* Warna Biru LogoKu */
        }

        .brand-header p {
            margin: 5px 0 0 0;
            font-size: 14px;
            color: #64748b;
        }

        .form-group {
            margin-bottom: 20px;
            position: relative;
        }

        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-size: 14px;
            font-weight: 600;
            color: #334155;
        }

        .form-group input {
            width: 100%;
            padding: 12px 16px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            font-size: 14px;
            color: #1e293b;
            outline: none;
            transition: all 0.2s ease;
        }

        .form-group input:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }

        .btn-submit {
            width: 100%;
            background-color: #3b82f6;
            color: #ffffff;
            border: none;
            padding: 14px;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            transition: background-color 0.2s ease;
            margin-top: 10px;
        }

        .btn-submit:hover {
            background-color: #2563eb;
        }

        /* Notifikasi Error */
        .alert-danger {
            background-color: #fee2e2;
            border: 1px solid #fca5a5;
            color: #991b1b;
            padding: 12px;
            border-radius: 8px;
            font-size: 13px;
            text-align: center;
            margin-bottom: 20px;
            display: <?php echo !empty($error_message) ? 'block' : 'none'; ?>;
        }
    </style>
</head>

<body>

    <div class="login-container">
        <div class="brand-header">
            <h2>Logo<span>Ku</span> Admin</h2>
            <p>Koneksi Database MySQL Aktif 🟢</p>
        </div>

        <!-- Kotak Error (Menampilkan pesan kegagalan dari database) -->
        <div id="error-box" class="alert-danger">
            <?php echo $error_message; ?>
        </div>

        <!-- Form Login -->
        <form id="loginForm" method="POST" action="login.php" onsubmit="return validasiKlien(event)">
            <div class="form-group">
                <label for="username">Username Admin</label>
                <input type="text" id="username" name="username" placeholder="Masukkan username" required autocomplete="off">
            </div>

            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" placeholder="Masukkan password" required>
            </div>

            <button type="submit" class="btn-submit">Masuk Ke Panel</button>
        </form>
    </div>

    <!-- EMBEDDED JAVASCRIPT (Validasi Awal Sisi Browser) -->
    <script>
        function validasiKlien(event) {
            const usernameInput = document.getElementById('username').value.trim();
            const passwordInput = document.getElementById('password').value;
            const errorBox = document.getElementById('error-box');

            // Proteksi awal JavaScript sebelum data dikirim ke MySQL
            if (usernameInput === '' || passwordInput === '') {
                event.preventDefault();
                errorBox.textContent = 'Kolom tidak boleh kosong!';
                errorBox.style.display = 'block';
                return false;
            }

            // Mengizinkan form dikirim ke server jika input terisi
            return true;
        }
    </script>

</body>

</html>