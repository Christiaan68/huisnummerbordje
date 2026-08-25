-- MySQL-schema voor het bewaren van bevestigde configuraties (bestellingen)
-- uit de webshop. Gebouwd voor TiDB Cloud (MySQL-compatible), maar werkt
-- op elke gewone MySQL-database.
--
-- LET OP: dit is een NIEUW, apart schema — niet hetzelfde als de
-- Postgres/Supabase-migraties in supabase/migrations/. Die blijven
-- ongebruikt staan (zie de technische inventarisatie van 19-8-2026); dit
-- MySQL-schema is wat de webshop vanaf nu daadwerkelijk gebruikt om
-- bestellingen te bewaren. Vormen/kleuren/maten/lettertypen blijven bewust
-- gewoon in config/product-options.ts staan (beslist door Christiaan op
-- 19-8-2026) — daarom staat hieronder bij elke bestelling zowel de
-- technische id als de leesbare naam van elke keuze rechtstreeks erbij
-- (bijvoorbeeld zowel "black" als "Zwart"), in plaats van een verwijzing
-- naar een aparte kleurentabel. Zo blijft een oude bestelling altijd
-- correct leesbaar, ook als er ooit iets in config/product-options.ts
-- verandert.
--
-- Dit bestand hoef je maar ÉÉN KEER uit te voeren, in het SQL-scherm van
-- je TiDB Cloud-cluster (zie de instructies die je apart hebt gekregen).

CREATE TABLE IF NOT EXISTS configurations (
  id INT AUTO_INCREMENT PRIMARY KEY,

  -- Vorm, afwerking, kleur, maat, lettertype
  shape_id VARCHAR(64) NOT NULL,
  shape_name VARCHAR(100) NOT NULL,
  finish ENUM('vlak', 'gewelfd') NOT NULL,
  color_id VARCHAR(64) NOT NULL,
  color_name VARCHAR(100) NOT NULL,
  size_id VARCHAR(64) NOT NULL,
  size_name VARCHAR(100) NOT NULL,
  font_id VARCHAR(64) NOT NULL,
  font_name VARCHAR(100) NOT NULL,

  -- Tekst op het bordje
  custom_text VARCHAR(10) NOT NULL,
  extra_line_1 VARCHAR(50) NULL,
  extra_line_2 VARCHAR(50) NULL,
  number_position ENUM('start', 'middle', 'end') NOT NULL DEFAULT 'start',

  -- Optionele kaderrand rond het bordje (toegevoegd 25-8-2026). Alleen
  -- beschikbaar voor niet-ovale vormen.
  has_frame BOOLEAN NOT NULL DEFAULT FALSE,

  -- Prijs op het moment van bestellen, in centen (zelfde eenheid als de
  -- rest van de code, zie lib/configuration/pricing.ts). price_source geeft
  -- aan of dit de live prijs van de prijstool was, of de vaste
  -- reservekopie (zie lib/configuration/livePricing.ts) — zo is bij elke
  -- oude bestelling nog te zien of de prijs "zeker" was.
  price_total_cents INT NULL,
  price_color_surcharge_cents INT NOT NULL DEFAULT 0,
  price_extra_chars_cents INT NOT NULL DEFAULT 0,
  price_extra_chars_count INT NOT NULL DEFAULT 0,
  price_frame_surcharge_cents INT NOT NULL DEFAULT 0,
  price_source ENUM('prijstool', 'reservekopie') NOT NULL,

  -- Klantgegevens (zelfde velden als het contactformulier)
  contact_name VARCHAR(100) NOT NULL,
  contact_address VARCHAR(150) NOT NULL,
  contact_postal_code VARCHAR(10) NOT NULL,
  contact_city VARCHAR(100) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(30) NULL,
  quantity VARCHAR(2) NOT NULL,

  -- Voorbereid voor later: er is nu nog geen scherm om dit te wijzigen,
  -- elke nieuwe bestelling krijgt gewoon 'nieuw'.
  status ENUM('nieuw', 'in_behandeling', 'afgerond', 'geannuleerd') NOT NULL DEFAULT 'nieuw',

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_created_at (created_at),
  INDEX idx_contact_email (contact_email)
);

-- MIGRATIE 25-8-2026: de tabel "configurations" hierboven bestond al in
-- productie (TiDB Cloud) vóórdat de kaderoptie werd toegevoegd —
-- "CREATE TABLE IF NOT EXISTS" voegt bij een al bestaande tabel GEEN nieuwe
-- kolommen toe. Voer daarom onderstaande twee regels ÉÉNMALIG uit in het
-- SQL-scherm van je TiDB Cloud-cluster (zelfde scherm als waar dit hele
-- bestand ooit is uitgevoerd) om de bestaande tabel bij te werken:

ALTER TABLE configurations ADD COLUMN has_frame BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE configurations ADD COLUMN price_frame_surcharge_cents INT NOT NULL DEFAULT 0;
