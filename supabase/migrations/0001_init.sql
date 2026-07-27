-- Database-architectuur (bijgewerkt: 4 vormen met eigen regels/afwerking/maten)
-- Uitvoeren via Supabase SQL editor of `supabase db push`

create extension if not exists "pgcrypto";

-- Referentietabellen -------------------------------------------------

create table if not exists product_shapes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  -- Aantal extra tekstregels bovenop het huisnummer (elk max. 20 tekens)
  extra_lines integer not null default 0 check (extra_lines in (0, 1, 2)),
  -- Welke afwerkingen mogelijk zijn voor deze vorm
  available_finishes text[] not null default array['vlak', 'gewelfd'],
  -- Toegestane range voor de intypbare tekengrootte (mm), per vorm instelbaar.
  character_size_min integer not null default 60,
  character_size_max integer not null default 200,
  -- Toegestane range voor de intypbare tekengrootte van extra tekstregels (mm).
  line_size_min integer not null default 10,
  line_size_max integer not null default 120,
  image_src text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists product_colors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  hex_value text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists product_sizes (
  id uuid primary key default gen_random_uuid(),
  shape_id uuid not null references product_shapes(id),
  name text not null,
  width numeric not null,
  height numeric not null,
  unit text not null default 'mm',
  -- Prijs per afwerking, in centen. NULL = niet beschikbaar voor deze vorm.
  -- LET OP: prijzen worden later ingevuld (zie config/product-options.ts).
  price_flat_cents integer,
  price_curved_cents integer,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists product_fonts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  css_family text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Kerntabel: configuraties -------------------------------------------

create table if not exists configurations (
  id uuid primary key default gen_random_uuid(),
  shape_id uuid not null references product_shapes(id),
  finish text not null check (finish in ('vlak', 'gewelfd')),
  color_id uuid not null references product_colors(id),
  size_id uuid not null references product_sizes(id),
  font_id uuid not null references product_fonts(id),
  custom_text text not null,       -- huisnummer, max. 2 tekens
  extra_line_1 text,                -- max. 20 tekens, alleen bij vormen met >=1 regel
  extra_line_2 text,                -- max. 20 tekens, alleen bij vormen met 2 regels
  -- Intypbare tekengrootte per regel, in mm. Toegestane range is per vorm
  -- ingesteld (zie product_shapes.character_size_min/max), hier alleen een
  -- ruime basischeck.
  number_size_mm integer not null check (number_size_mm between 1 and 1000),
  line1_size_mm integer check (line1_size_mm between 1 and 1000),
  line2_size_mm integer check (line2_size_mm between 1 and 1000),
  status text not null default 'draft'
    check (status in ('draft', 'confirmed', 'paid', 'completed', 'cancelled')),

  -- Voorbereid op toekomstige betaalintegratie (Mollie/Stripe)
  price_cents integer,
  currency text not null default 'EUR',
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'pending', 'paid', 'failed', 'refunded')),
  payment_provider text check (payment_provider in ('mollie', 'stripe')),
  transaction_id text,
  paid_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Row Level Security ---------------------------------------------------

alter table product_shapes enable row level security;
alter table product_colors enable row level security;
alter table product_sizes enable row level security;
alter table product_fonts enable row level security;
alter table configurations enable row level security;

create policy "Publiek leesbaar: actieve vormen"
  on product_shapes for select using (active = true);
create policy "Publiek leesbaar: actieve kleuren"
  on product_colors for select using (active = true);
create policy "Publiek leesbaar: actieve maten"
  on product_sizes for select using (active = true);
create policy "Publiek leesbaar: actieve lettertypes"
  on product_fonts for select using (active = true);

-- configurations: geen directe toegang vanuit de browser.
-- Alle schrijf- en leesacties lopen via API routes met de service role key.
