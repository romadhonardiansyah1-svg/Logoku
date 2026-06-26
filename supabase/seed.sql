-- Seed data for LogoKu (categories + 9 catalog logos).
-- image_path uses repo-relative paths (assets/img/catalog/*.png) served by the
-- same static site; catalogImageUrl() returns these as-is. Run once after the
-- migration. Re-running will duplicate catalog rows (categories are guarded).

insert into categories (category_name, slug) values
  ('Kuliner & Kafe', 'kuliner-kafe'),
  ('Corporate & Bisnis', 'corporate-bisnis'),
  ('Minimalis & Modern', 'minimalis-modern')
on conflict (slug) do nothing;

insert into catalogs (category_id, title, description, image_path, is_published, sort_order) values
  ((select id from categories where slug='minimalis-modern'),
   'Creative Agency', 'Monogram dinamis hitam-putih yang elegan, pas untuk agensi kreatif & studio.',
   'assets/img/catalog/creative-agency.png', true, 1),
  ((select id from categories where slug='kuliner-kafe'),
   'Mo Drink', 'Ikon gelas minuman modern, cocok untuk kedai minuman dan coffee shop kekinian.',
   'assets/img/catalog/mo-drink.png', true, 2),
  ((select id from categories where slug='corporate-bisnis'),
   'Fauget Fishing Club', 'Maskot ikan dinamis yang energik untuk komunitas, klub, atau brand outdoor.',
   'assets/img/catalog/fauget-fishing.png', true, 3),
  ((select id from categories where slug='corporate-bisnis'),
   'Bailey Dupont Perumahan', 'Kombinasi atap dan daun yang asri, ideal untuk properti dan perumahan hijau.',
   'assets/img/catalog/bailey-dupont.png', true, 4),
  ((select id from categories where slug='minimalis-modern'),
   'Global Design Studio', 'Wordmark tebal dengan ikon globe, tegas untuk studio kreatif dan korporasi.',
   'assets/img/catalog/global-studio.png', true, 5),
  ((select id from categories where slug='minimalis-modern'),
   'Venture', 'Lettermark biru yang bersih dan modern, cocok untuk startup dan brand teknologi.',
   'assets/img/catalog/venture.png', true, 6),
  ((select id from categories where slug='corporate-bisnis'),
   'Bengkel Cak Mat', 'Gir mesin tegas merah-biru untuk bengkel dan jasa otomotif.',
   'assets/img/catalog/bengkel-cak-mat.png', true, 7),
  ((select id from categories where slug='corporate-bisnis'),
   'Atma', 'Ikon gedung minimalis navy-oranye untuk perusahaan dan konstruksi.',
   'assets/img/catalog/atma.png', true, 8),
  ((select id from categories where slug='minimalis-modern'),
   'Creative Technology', 'Garis spirograf artistik untuk brand teknologi dan inovasi.',
   'assets/img/catalog/creative-technology.png', true, 9);
