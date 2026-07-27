-- FASE 4/6-herziening: vormen zijn nu 4 concrete productvarianten met
-- eigen regel-opties en afwerking (vlak/gewelfd), maten zijn vorm-specifiek
-- met een eigen prijs per afwerking. Uitvoeren ná 0001_init.sql.

-- product_shapes: extra kolommen voor regels en beschikbare afwerkingen
alter table product_shapes
  add column if not exists description text not null default '',
  add column if not exists extra_lines smallint not null default 0
    check (extra_lines in (0, 1, 2)),
  add column if not exists available_finishes text[] not null default array['vlak', 'gewelfd']
    check (available_finishes <@ array['vlak', 'gewelfd']),
  add column if not exists image_path text;

-- product_sizes: maat is nu verplicht gekoppeld aan een vorm, met een
-- aparte prijs per afwerking. Eenheid is mm i.p.v. cm.
alter table product_sizes
  alter column shape_id set not null,
  alter column unit set default 'mm';

alter table product_sizes
  add column if not exists price_flat_cents integer,
  add column if not exists price_curved_cents integer;

-- De oude generieke price_cents-kolom vervalt: prijs is nu per afwerking.
alter table product_sizes drop column if exists price_cents;

-- configurations: vastleggen welke afwerking en eventuele extra
-- tekstregels bij een bestelling horen. custom_text blijft het huisnummer
-- (max. 2 tekens, afgedwongen in de applicatielaag via Zod).
alter table configurations
  add column if not exists finish text not null default 'gewelfd'
    check (finish in ('vlak', 'gewelfd')),
  add column if not exists extra_line_1 text,
  add column if not exists extra_line_2 text;
