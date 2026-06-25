document.addEventListener('DOMContentLoaded', function () {
    // 1. Logika Toggle Navigasi Menu Mobile (Hamburger)
    // Kode ini dijalankan setelah semua elemen HTML selesai dimuat
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('navMenu');

    // Pastikan kedua elemen ada sebelum menambahkan event listener
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', function () {
            navMenu.classList.toggle('active');
            mobileMenuBtn.classList.toggle('toggle-active'); // Menambahkan toggle untuk ikon hamburger
        });
    }

    // 2. Logika Live-Filter Galeri Katalog LogoKu
    const filterButtons = document.querySelectorAll('.filter-btn');
    const catalogItems = document.querySelectorAll('.catalog-item');

    filterButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Hapus kelas aktif dari semua tombol, lalu pasang di tombol yang diklik
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            const filterValue = this.getAttribute('data-filter');

            // Menyembunyikan atau menampilkan item sesuai kategori
            catalogItems.forEach(item => {
                const itemCategory = item.getAttribute('data-category');
                
                if (filterValue === 'all' || itemCategory === filterValue) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });

    // 3. Logika Accordion untuk FAQ
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        const icon = item.querySelector('.faq-icon');

        question.addEventListener('click', () => {
            item.classList.toggle('active');
            answer.style.maxHeight = item.classList.contains('active') ? answer.scrollHeight + "px" : "0";
            icon.textContent = item.classList.contains('active') ? '−' : '+';
        });
    });

    // 4. Logika Interaktif untuk Form Brief (Color Picker Modern)
    function setupColorPicker(pickerId, textId) {
        const colorPicker = document.getElementById(pickerId);
        const colorText = document.getElementById(textId);

        if (colorPicker && colorText) {
            colorPicker.addEventListener('input', function() {
                colorText.value = this.value.toUpperCase();
            });
        }
    }
    setupColorPicker('primary_color', 'primary_color_hex');
    setupColorPicker('secondary_color', 'secondary_color_hex');
});