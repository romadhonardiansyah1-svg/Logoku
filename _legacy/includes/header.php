<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LogoCraft - Jasa Desain Logo & Branding Profesional</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <link rel="stylesheet" href="assets/css/style.css">
</head>

<body>

    <header>
        <div class="container header-wrapper">
            <a href="index.php" class="logo">
                Logo<span>Ku</span>
            </a>

            <div class="menu-toggle" id="mobileMenuBtn">
                <span></span>
                <span></span>
                <span></span>
            </div>

            <nav id="navMenu">
                <a href="index.php#katalog">Katalog Desain</a>
                <a href="index.php#harga">Paket Harga</a>
                <a href="index.php#cara-kerja">Cara Kerja</a>
                <a href="index.php#faq">FAQ</a>

                <?php if (isset($_SESSION['admin_logged_in'])): ?>
                    <a href="admin/dashboard.php" class="btn-dashboard">Dashboard Admin</a>
                    <a href="admin/logout.php" class="logout-link">Keluar</a>
                <?php else: ?>
                    <a href="admin/login.php">Login Admin</a>
                    <a href="brief.php" class="btn-order">Pesan Logo Sekarang</a>
                <?php endif; ?>
            </nav>

        </div>
    </header>

    <main class="container">