-- ============================================================
-- LogoKu — initial schema (Postgres / Supabase)
-- Migrated & unified from legacy MySQL (categories, catalogs,
-- users/admins, orders/pesanan). Includes enums, RLS, helper
-- function, signup trigger, and Storage policies.
-- ============================================================

-- ---------- ENUM TYPES (Indonesian labels preserved verbatim) ----------
create type progress_status as enum ('Antrean','Proses Sketsa','Digitalisasi','Revisi','Selesai');
create type payment_status  as enum ('Belum Lunas','DP','Lunas');

-- ---------- TABLES ----------
create table categories (
  id            bigint generated always as identity primary key,
  category_name text not null,
  slug          text not null unique,
  created_at    timestamptz not null default now()
);

create table catalogs (
  id            bigint generated always as identity primary key,
  category_id   bigint references categories(id) on delete set null,
  title         text not null,
  description   text,
  image_path    text,                 -- Supabase Storage object path (replaces uploads/catalog/<file>)
  is_published  boolean not null default true,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);
create index idx_catalogs_category on catalogs(category_id);
create index idx_catalogs_published on catalogs(is_published, sort_order);

create table customers (
  id              bigint generated always as identity primary key,
  whatsapp_number text not null unique,   -- normalized 62xxxxxxxxxx
  full_name       text not null,
  created_at      timestamptz not null default now()
);

create table orders (
  id                   bigint generated always as identity primary key,
  order_number         text unique,                  -- LKU-YYYY-#### generated server-side
  customer_id          bigint not null references customers(id) on delete cascade,
  package_id           int,                           -- 1..4 pricing package (nullable)
  reference_catalog_id bigint references catalogs(id) on delete set null,
  -- creative brief fields
  brand_name           text not null,
  tagline              text,
  brand_description    text not null,
  primary_color        text,                          -- hex e.g. #7c3aed
  secondary_color      text,
  logo_style_notes     text,
  -- admin workflow fields
  progress_status      progress_status not null default 'Antrean',
  payment_status       payment_status  not null default 'Belum Lunas',
  total_amount         int not null default 0,        -- IDR, integer rupiah
  dp_amount            int not null default 0,
  payment_proof_path   text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint dp_lte_total check (dp_amount <= total_amount),
  constraint amounts_non_negative check (total_amount >= 0 and dp_amount >= 0)
);
create index idx_orders_customer on orders(customer_id);
create index idx_orders_created on orders(created_at desc);

create table admin_profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  role       text not null default 'pending',  -- 'pending' | 'admin' | 'owner'
  created_at timestamptz not null default now(),
  constraint valid_role check (role in ('pending','admin','owner'))
);

-- NOTE: there is NO otp_verifications table. Ordering is a plain wa.me
-- direct chat with no OTP and no server tier.

-- ---------- updated_at trigger for orders ----------
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end; $$;
create trigger trg_orders_updated_at
  before update on orders for each row execute function set_updated_at();

-- ---------- helper: is current JWT an approved admin? ----------
create or replace function is_admin() returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 from public.admin_profiles
    where id = auth.uid() and role in ('admin','owner')
  );
$$;

-- ---------- signup trigger: provision admin_profiles row (role='pending') ----------
create or replace function handle_new_user() returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.admin_profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'pending')
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table categories        enable row level security;
alter table catalogs          enable row level security;
alter table customers         enable row level security;
alter table orders            enable row level security;
alter table admin_profiles    enable row level security;

-- PUBLIC READS (anon + authenticated): categories + published catalogs only
create policy "public read categories" on categories
  for select to anon, authenticated using (true);
create policy "public read published catalogs" on catalogs
  for select to anon, authenticated using (is_published = true);

-- PUBLIC BRIEF WRITES: handled exclusively by the SECURITY DEFINER function
-- submit_brief() (defined below). Anon has NO direct insert/select/update/delete
-- policy on customers/orders, so the only way to create a public order is via
-- the validated RPC, and a visitor can never read/list/modify any row.

-- ADMIN MANAGES CATALOG + CATEGORIES
create policy "admin all catalogs" on catalogs
  for all to authenticated using (is_admin()) with check (is_admin());
create policy "admin all categories" on categories
  for all to authenticated using (is_admin()) with check (is_admin());

-- ORDERS + CUSTOMERS: admin only
create policy "admin read orders" on orders
  for select to authenticated using (is_admin());
create policy "admin write orders" on orders
  for all to authenticated using (is_admin()) with check (is_admin());
create policy "admin read customers" on customers
  for select to authenticated using (is_admin());
create policy "admin write customers" on customers
  for all to authenticated using (is_admin()) with check (is_admin());

-- ADMIN PROFILES: read own (or admins read all); only owners change roles
create policy "read own profile" on admin_profiles
  for select to authenticated using (id = auth.uid() or is_admin());
create policy "owner manages roles" on admin_profiles
  for update to authenticated using (
    exists (select 1 from admin_profiles where id = auth.uid() and role = 'owner')
  );

-- ---------- public RPC: submit_brief (atomic anon order creation) ----------
-- Anon clients cannot SELECT customers back to obtain an id, so a single
-- SECURITY DEFINER function performs the customer upsert + order insert + order
-- number generation atomically and returns the order number. This keeps the
-- "no server tier" property (logic lives in Postgres) while guaranteeing
-- read isolation (anon still has no SELECT on customers/orders).
create or replace function submit_brief(
  p_phone        text,
  p_full_name    text,
  p_brand_name   text,
  p_brand_desc   text,
  p_package_id   int     default null,
  p_ref_id       bigint  default null,
  p_tagline      text    default null,
  p_primary      text    default null,
  p_secondary    text    default null,
  p_notes        text    default null
) returns text
language plpgsql security definer
set search_path = public
as $$
declare
  v_customer_id bigint;
  v_order_id    bigint;
  v_order_no    text;
begin
  if p_phone is null or p_phone !~ '^62[0-9]{6,}$' then
    raise exception 'invalid_phone';
  end if;
  if coalesce(trim(p_full_name),'') = '' or coalesce(trim(p_brand_name),'') = ''
     or coalesce(trim(p_brand_desc),'') = '' then
    raise exception 'missing_fields';
  end if;

  insert into customers (whatsapp_number, full_name)
  values (p_phone, p_full_name)
  on conflict (whatsapp_number) do update set full_name = excluded.full_name
  returning id into v_customer_id;

  insert into orders (
    customer_id, package_id, reference_catalog_id, brand_name, tagline,
    brand_description, primary_color, secondary_color, logo_style_notes,
    progress_status, payment_status
  ) values (
    v_customer_id, p_package_id, p_ref_id, p_brand_name, p_tagline,
    p_brand_desc, p_primary, p_secondary, p_notes,
    'Antrean', 'Belum Lunas'
  ) returning id into v_order_id;

  v_order_no := 'LKU-' || extract(year from now())::int || '-' || lpad(v_order_id::text, 4, '0');
  update orders set order_number = v_order_no where id = v_order_id;

  return v_order_no;
end; $$;

grant execute on function submit_brief(text,text,text,text,int,bigint,text,text,text,text) to anon, authenticated;

-- ---------- public RPC: track_order (customer order tracking) ----------
-- Returns a SINGLE order's public-safe status, but ONLY when both the order
-- number AND the matching WhatsApp number are supplied. Anon has no SELECT on
-- orders/customers, so this is the only public read path and it cannot be used
-- to enumerate others' orders (need to know order_number + phone together).
create or replace function track_order(p_order_number text, p_phone text)
returns table (
  order_number    text,
  brand_name      text,
  progress_status progress_status,
  payment_status  payment_status,
  total_amount    int,
  dp_amount       int,
  created_at      timestamptz,
  updated_at      timestamptz
)
language sql security definer
set search_path = public
stable
as $$
  select o.order_number, o.brand_name, o.progress_status, o.payment_status,
         o.total_amount, o.dp_amount, o.created_at, o.updated_at
  from public.orders o
  join public.customers c on c.id = o.customer_id
  where o.order_number = upper(btrim(p_order_number))
    and c.whatsapp_number = p_phone
  limit 1;
$$;

grant execute on function track_order(text, text) to anon, authenticated;

-- ============================================================
-- STORAGE BUCKETS + POLICIES
-- ============================================================
insert into storage.buckets (id, name, public)
values ('catalog-images','catalog-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('payment-proofs','payment-proofs', false)
on conflict (id) do nothing;

-- catalog-images: public read, admin write
create policy "catalog public read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'catalog-images');
create policy "catalog admin write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'catalog-images' and is_admin());
create policy "catalog admin update" on storage.objects
  for update to authenticated
  using (bucket_id = 'catalog-images' and is_admin());
create policy "catalog admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'catalog-images' and is_admin());

-- payment-proofs: admin read only (writes go through service-role function)
create policy "proofs admin read" on storage.objects
  for select to authenticated
  using (bucket_id = 'payment-proofs' and is_admin());
