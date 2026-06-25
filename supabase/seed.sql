-- Seed data for local development (categories + sample catalog items)
insert into categories (category_name, slug) values
  ('Kuliner & Kafe', 'kuliner-kafe'),
  ('Corporate & Bisnis', 'corporate-bisnis'),
  ('Minimalis & Modern', 'minimalis-modern');

insert into catalogs (category_id, title, description, image_path, is_published, sort_order) values
  ((select id from categories where slug='kuliner-kafe'),
   'Kopi Kenangan Senja', 'Tipografi hangat dengan ikon retro estetik. Cocok untuk kedai kopi kekinian.', null, true, 1),
  ((select id from categories where slug='corporate-bisnis'),
   'Apex Holding Corp', 'Geometris, kokoh, melambangkan pertumbuhan bisnis yang stabil dan tepercaya.', null, true, 2),
  ((select id from categories where slug='minimalis-modern'),
   'Purely Organics', 'Sentuhan garis organik feminin mewah, ideal untuk kosmetik dan kecantikan.', null, true, 3);
