-- =============================================
-- AQUANICS — Supabase Schema
-- Paste this entire file into Supabase SQL Editor and click Run.
-- =============================================

-- ── CATEGORIES ──────────────────────────────
create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  emoji       text,
  description text,
  sort_order  int  default 0,
  active      boolean default true,
  created_at  timestamptz default now()
);

-- ── SUBCATEGORIES ────────────────────────────
create table if not exists subcategories (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete cascade,
  name        text not null,
  slug        text not null,
  active      boolean default true,
  created_at  timestamptz default now(),
  unique(category_id, slug)
);

-- ── PRODUCTS ─────────────────────────────────
create table if not exists products (
  id              bigint primary key generated always as identity,
  name            text not null,
  category_slug   text references categories(slug) on delete set null,
  subcategory_slug text,
  price           numeric(10,2) not null,
  mrp             numeric(10,2),
  stock_qty       int default -1,        -- -1 = unlimited
  image_url       text,
  images          jsonb default '[]',
  description     text,
  highlights      jsonb default '[]',
  specifications  jsonb default '{}',
  rating          numeric(3,1) default 4.5,
  review_count    int default 0,
  sales_count     int default 0,
  featured        boolean default false,
  active          boolean default true,
  in_stock        boolean default true,
  created_at      timestamptz default now()
);

-- ── USERS ─────────────────────────────────────
-- No passwords. Login is OTP-only.
-- All user rows are created/read by the app itself.
create table if not exists users (
  id          uuid primary key default gen_random_uuid(),
  phone       text not null unique,
  name        text not null,
  email       text,
  created_at  timestamptz default now()
);

-- ── SESSIONS ─────────────────────────────────
-- Token-based sessions stored entirely in DB.
-- No plaintext passwords anywhere.
create table if not exists sessions (
  id          uuid primary key default gen_random_uuid(),
  token       text not null unique,
  user_id     uuid references users(id) on delete cascade,
  expires_at  timestamptz not null,
  created_at  timestamptz default now()
);
-- Auto-delete expired sessions (Supabase cron or just let app clean up)
create index if not exists sessions_token_idx on sessions(token);
create index if not exists sessions_user_idx  on sessions(user_id);

-- ── ORDERS ───────────────────────────────────
create table if not exists orders (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references users(id) on delete set null,
  items           jsonb not null default '[]',
  address         jsonb not null default '{}',
  subtotal        numeric(10,2),
  delivery_fee    numeric(10,2) default 0,
  discount        numeric(10,2) default 0,
  total           numeric(10,2) not null,
  payment_id      text,
  payment_status  text default 'paid',
  status          text default 'confirmed'
                  check(status in ('confirmed','processing','dispatched','out_for_delivery','delivered','cancelled')),
  promo_code      text,
  notes           text,
  created_at      timestamptz default now()
);
create index if not exists orders_user_idx   on orders(user_id);
create index if not exists orders_status_idx on orders(status);

-- ── PROMO CODES ──────────────────────────────
create table if not exists promo_codes (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  type        text not null check(type in ('percent','flat')),
  value       numeric(10,2) not null,
  description text,
  max_uses    int,
  uses_count  int default 0,
  expires_at  timestamptz,
  active      boolean default true,
  created_at  timestamptz default now()
);

-- ── REVIEWS ──────────────────────────────────
create table if not exists reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  bigint references products(id) on delete cascade,
  user_id     uuid   references users(id)    on delete set null,
  rating      int    not null check(rating between 1 and 5),
  comment     text,
  created_at  timestamptz default now()
);

-- ── SUPPORT TICKETS ──────────────────────────
create table if not exists support_tickets (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid references orders(id) on delete set null,
  user_id     uuid references users(id)  on delete set null,
  message     text not null,
  status      text default 'open',
  created_at  timestamptz default now()
);

-- ── SETTINGS ─────────────────────────────────
create table if not exists settings (
  id                        int primary key default 1,
  store_name                text    default 'Aquanics by Coreconics',
  email                     text,
  whatsapp                  text,
  phone                     text,
  address                   text,
  free_delivery_threshold   numeric default 599,
  delivery_fee              numeric default 49
);
insert into settings (id) values (1) on conflict (id) do nothing;

-- =============================================
-- RPC: Increment sales count safely
-- =============================================
create or replace function increment_sales(product_id bigint, qty int)
returns void language plpgsql as $$
begin
  update products set sales_count = coalesce(sales_count,0) + qty where id = product_id;
end;
$$;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Categories — public read
alter table categories enable row level security;
drop policy if exists "public_read_cats" on categories;
create policy "public_read_cats" on categories for select using (true);
drop policy if exists "admin_all_cats" on categories;
create policy "admin_all_cats"   on categories for all    using (true);

-- Subcategories — public read
alter table subcategories enable row level security;
drop policy if exists "public_read_subcats" on subcategories;
create policy "public_read_subcats" on subcategories for select using (true);
drop policy if exists "admin_all_subcats"   on subcategories;
create policy "admin_all_subcats"   on subcategories for all    using (true);

-- Products — public read active only
alter table products enable row level security;
drop policy if exists "public_read_products" on products;
create policy "public_read_products" on products for select using (active = true);
drop policy if exists "admin_all_products"   on products;
create policy "admin_all_products"   on products for all    using (true);

-- Users — insert (register) by anyone; read by anyone (for order lookup); admin full
alter table users enable row level security;
drop policy if exists "anyone_register"  on users;
create policy "anyone_register"  on users for insert with check (true);
drop policy if exists "public_read_users" on users;
create policy "public_read_users" on users for select using (true);
drop policy if exists "admin_all_users"   on users;
create policy "admin_all_users"   on users for all    using (true);

-- Sessions — insert/read/delete by anyone (app handles token verification)
alter table sessions enable row level security;
drop policy if exists "anyone_sessions" on sessions;
create policy "anyone_sessions" on sessions for all using (true);

-- Orders — insert & read & update by anyone (app verifies ownership by user_id)
alter table orders enable row level security;
drop policy if exists "anyone_orders" on orders;
create policy "anyone_orders" on orders for all using (true);

-- Promo codes — public read active; admin full
alter table promo_codes enable row level security;
drop policy if exists "public_read_promos" on promo_codes;
create policy "public_read_promos" on promo_codes for select using (active = true);
drop policy if exists "admin_all_promos"   on promo_codes;
create policy "admin_all_promos"   on promo_codes for all    using (true);

-- Reviews — public read, anyone can insert
alter table reviews enable row level security;
drop policy if exists "public_read_reviews" on reviews;
create policy "public_read_reviews" on reviews for select using (true);
drop policy if exists "anyone_add_review"   on reviews;
create policy "anyone_add_review"   on reviews for insert with check (true);

-- Support tickets — anyone can create; admin reads
alter table support_tickets enable row level security;
drop policy if exists "anyone_ticket"     on support_tickets;
create policy "anyone_ticket"     on support_tickets for insert with check (true);
drop policy if exists "admin_read_ticket" on support_tickets;
create policy "admin_read_ticket" on support_tickets for select using (true);

-- Settings — public read; admin write
alter table settings enable row level security;
drop policy if exists "public_read_settings" on settings;
create policy "public_read_settings" on settings for select using (true);
drop policy if exists "admin_all_settings"   on settings;
create policy "admin_all_settings"   on settings for all    using (true);

-- =============================================
-- SEED: Default Categories
-- =============================================
insert into categories (name, slug, emoji, sort_order, active) values
  ('Live Fish',        'live-fish',    '🐠', 1, true),
  ('Aquariums & Tanks','aquariums',    '🐟', 2, true),
  ('Birds',            'birds',        '🦜', 3, true),
  ('Dogs',             'dogs',         '🐶', 4, true),
  ('Cats',             'cats',         '🐱', 5, true),
  ('Other Pets',       'other-pets',   '🐾', 6, true),
  ('Accessories',      'accessories',  '🛒', 7, true)
on conflict (slug) do nothing;

-- Subcategories: Live Fish
insert into subcategories (category_id, name, slug)
select id,'Freshwater Fish','freshwater' from categories where slug='live-fish' on conflict do nothing;
insert into subcategories (category_id, name, slug)
select id,'Marine Fish','marine' from categories where slug='live-fish' on conflict do nothing;
insert into subcategories (category_id, name, slug)
select id,'Goldfish','goldfish' from categories where slug='live-fish' on conflict do nothing;
insert into subcategories (category_id, name, slug)
select id,'Betta Fish','betta' from categories where slug='live-fish' on conflict do nothing;

-- Subcategories: Aquariums
insert into subcategories (category_id, name, slug)
select id,'Complete Kits','kits' from categories where slug='aquariums' on conflict do nothing;
insert into subcategories (category_id, name, slug)
select id,'Filters & Pumps','filters' from categories where slug='aquariums' on conflict do nothing;
insert into subcategories (category_id, name, slug)
select id,'Lighting','lighting' from categories where slug='aquariums' on conflict do nothing;
insert into subcategories (category_id, name, slug)
select id,'Decor & Plants','decor' from categories where slug='aquariums' on conflict do nothing;
insert into subcategories (category_id, name, slug)
select id,'Fish Food','food' from categories where slug='aquariums' on conflict do nothing;

-- Subcategories: Birds
insert into subcategories (category_id, name, slug)
select id,'Parrots','parrots' from categories where slug='birds' on conflict do nothing;
insert into subcategories (category_id, name, slug)
select id,'Finches & Canaries','finches' from categories where slug='birds' on conflict do nothing;
insert into subcategories (category_id, name, slug)
select id,'Bird Cages','cages' from categories where slug='birds' on conflict do nothing;
insert into subcategories (category_id, name, slug)
select id,'Bird Food','food' from categories where slug='birds' on conflict do nothing;

-- Subcategories: Dogs
insert into subcategories (category_id, name, slug)
select id,'Dog Food','food' from categories where slug='dogs' on conflict do nothing;
insert into subcategories (category_id, name, slug)
select id,'Toys','toys' from categories where slug='dogs' on conflict do nothing;
insert into subcategories (category_id, name, slug)
select id,'Beds & Kennels','beds' from categories where slug='dogs' on conflict do nothing;
insert into subcategories (category_id, name, slug)
select id,'Healthcare','healthcare' from categories where slug='dogs' on conflict do nothing;

-- Subcategories: Cats
insert into subcategories (category_id, name, slug)
select id,'Cat Food','food' from categories where slug='cats' on conflict do nothing;
insert into subcategories (category_id, name, slug)
select id,'Litter & Hygiene','litter' from categories where slug='cats' on conflict do nothing;
insert into subcategories (category_id, name, slug)
select id,'Toys & Furniture','toys' from categories where slug='cats' on conflict do nothing;

-- =============================================
-- Done! Your database is ready.
-- =============================================

-- =============================================
-- ADD admin_password column to settings
-- (Run this after the main schema if already created)
-- =============================================
alter table settings add column if not exists admin_password text default 'aquanics2024';

-- Update existing row to have the default password
update settings set admin_password = 'aquanics2024' where id = 1 and admin_password is null;
