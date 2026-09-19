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
  -- font_id/font_name: sinds 28-8-2026 specifiek het lettertype van het
  -- HUISNUMMER (elk tekstveld heeft nu een eigen lettertype) — zie de
  -- migratie van 28-8-2026 verderop in dit bestand.
  font_id VARCHAR(64) NOT NULL,
  font_name VARCHAR(100) NOT NULL,
  line1_font_id VARCHAR(64) NULL,
  line1_font_name VARCHAR(100) NULL,
  line2_font_id VARCHAR(64) NULL,
  line2_font_name VARCHAR(100) NULL,

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

  -- Betaalstatus via Mollie (toegevoegd 29-8-2026, zie de migratie
  -- hieronder). Een bestelling wordt AL in deze tabel gezet zodra de klant
  -- naar Mollie doorgestuurd wordt (status 'pending', nog niets gemaild),
  -- en pas op 'paid' gezet zodra Mollie via een "webhook" bevestigt dat er
  -- echt betaald is — pas dán gaan de bevestigingsmails ook echt uit (zie
  -- app/api/mollie-webhook/route.ts). mollie_payment_id is Mollie's eigen
  -- kenmerk van de betaling (handig om in het Mollie-dashboard op te
  -- zoeken); paid_at is het moment waarop de betaling bevestigd werd.
  payment_status ENUM('pending', 'paid', 'failed', 'expired', 'canceled') NOT NULL DEFAULT 'pending',
  mollie_payment_id VARCHAR(64) NULL,
  paid_at TIMESTAMP NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_created_at (created_at),
  INDEX idx_contact_email (contact_email),
  INDEX idx_mollie_payment_id (mollie_payment_id)
);

-- MIGRATIE 25-8-2026: de tabel "configurations" hierboven bestond al in
-- productie (TiDB Cloud) vóórdat de kaderoptie werd toegevoegd —
-- "CREATE TABLE IF NOT EXISTS" voegt bij een al bestaande tabel GEEN nieuwe
-- kolommen toe. Voer daarom onderstaande twee regels ÉÉNMALIG uit in het
-- SQL-scherm van je TiDB Cloud-cluster (zelfde scherm als waar dit hele
-- bestand ooit is uitgevoerd) om de bestaande tabel bij te werken:

ALTER TABLE configurations ADD COLUMN has_frame BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE configurations ADD COLUMN price_frame_surcharge_cents INT NOT NULL DEFAULT 0;

-- MIGRATIE 28-8-2026: elk tekstveld (huisnummer, tekstregel 1, tekstregel 2)
-- heeft sinds deze datum zijn eigen lettertype (voorheen 1 lettertype voor
-- het hele bordje). De bestaande kolommen font_id/font_name blijven
-- ONGEWIJZIGD staan en bevatten voortaan het lettertype van het HUISNUMMER
-- (bestaande, al bevestigde bestellingen hadden toch al voor alle
-- tekstvelden hetzelfde lettertype, dus hun betekenis verandert feitelijk
-- niet). Voer onderstaande vier regels ÉÉNMALIG uit in hetzelfde SQL-scherm
-- om de 2 nieuwe, optionele kolomparen toe te voegen (NULL zolang een
-- bestelling geen tekstregel 1/2 heeft):

ALTER TABLE configurations ADD COLUMN line1_font_id VARCHAR(64) NULL;
ALTER TABLE configurations ADD COLUMN line1_font_name VARCHAR(100) NULL;
ALTER TABLE configurations ADD COLUMN line2_font_id VARCHAR(64) NULL;
ALTER TABLE configurations ADD COLUMN line2_font_name VARCHAR(100) NULL;

-- MIGRATIE 29-8-2026: betalen via Mollie toegevoegd. Een bestelling komt
-- voortaan AL in deze tabel te staan zodra de klant naar Mollie
-- doorgestuurd wordt (nog vóór er betaald is), met payment_status
-- 'pending' — dat is nieuw: eerder kwam een bestelling pas in de tabel
-- terecht op het moment dat de bevestigingsmails al verstuurd waren. Voer
-- onderstaande drie regels ÉÉNMALIG uit in hetzelfde SQL-scherm om de 3
-- nieuwe kolommen toe te voegen (bestaande, al vóór deze migratie
-- geplaatste bestellingen krijgen automatisch 'paid' mee, want die waren
-- immers al (buiten Mollie om) afgerond en gemaild):

ALTER TABLE configurations ADD COLUMN payment_status ENUM('pending', 'paid', 'failed', 'expired', 'canceled') NOT NULL DEFAULT 'pending';
ALTER TABLE configurations ADD COLUMN mollie_payment_id VARCHAR(64) NULL;
ALTER TABLE configurations ADD COLUMN paid_at TIMESTAMP NULL;
ALTER TABLE configurations ADD INDEX idx_mollie_payment_id (mollie_payment_id);
UPDATE configurations SET payment_status = 'paid' WHERE payment_status = 'pending';

-- MIGRATIE 9-9-2026: uitbreiding naar 7 vormen — 3 nieuwe vormen in
-- jaren-30-stijl met bevestigingsogen ("oren"), zie config/product-options.ts
-- (colorMode "ears-and-plate") en types/product.ts. Deze 3 vormen kennen,
-- anders dan de 4 oorspronkelijke vormen, GEEN ENKELE kleur (color_id/
-- color_name), maar TWEE losse, allebei verplichte kleuren: één voor de
-- "oren" en één voor het vlak, allebei gekozen uit een aparte kleurenlijst
-- (productColorsOren in config/product-options.ts, nooit uit dezelfde lijst
-- als color_id/color_name).
--
-- Daarvoor zijn twee dingen nodig:
-- 1) de bestaande kolommen color_id/color_name (hierboven bij de CREATE
--    TABLE nog NOT NULL) moeten NULL mogen worden — voor deze 3 nieuwe
--    vormen wordt hier altijd NULL in gezet, precies zoals nu al gebeurt bij
--    bv. font_id-achtige "niet van toepassing"-gevallen elders in deze tabel.
-- 2) er komen 4 nieuwe, optionele kolommen bij voor de kleur van de oren en
--    het vlak (id + leesbare naam, zelfde opzet als color_id/color_name
--    zelf — zie de toelichting bovenaan dit bestand over waarom zowel de
--    technische id als de naam bewaard blijven).
--
-- De 4 oorspronkelijke vormen blijven dit allemaal gewoon NULL laten (hun
-- color_id/color_name blijven zoals nu gevuld) — voer onderstaande zes
-- regels ÉÉNMALIG uit in hetzelfde SQL-scherm om de tabel bij te werken:

ALTER TABLE configurations MODIFY COLUMN color_id VARCHAR(64) NULL;
ALTER TABLE configurations MODIFY COLUMN color_name VARCHAR(100) NULL;
ALTER TABLE configurations ADD COLUMN ear_color_id VARCHAR(64) NULL AFTER color_name;
ALTER TABLE configurations ADD COLUMN ear_color_name VARCHAR(100) NULL AFTER ear_color_id;
ALTER TABLE configurations ADD COLUMN plate_color_id VARCHAR(64) NULL AFTER ear_color_name;
ALTER TABLE configurations ADD COLUMN plate_color_name VARCHAR(100) NULL AFTER plate_color_id;

-- custom_text (VARCHAR(10), zie de CREATE TABLE hierboven) hoeft NIET
-- gewijzigd te worden: de nieuwe "oren"-vormen staan maximaal 7 tekens toe
-- (zie houseNumberEarsSchema in lib/validation/text-input.schema.ts), dat
-- past ruim binnen de bestaande kolombreedte.

-- MIGRATIE 16-9-2026: uitbreiding orderoverzicht beheertool met
-- betaalmethode, bank en foutreden (op verzoek van Christiaan). Deze drie
-- kolommen worden gevuld door de Mollie-webhook (zie
-- app/api/mollie-webhook/route.ts) zodra Mollie een EINDSTATUS doorgeeft
-- (betaald, mislukt, verlopen of geannuleerd) — voor een order die nog
-- 'pending' is, staan ze dus nog leeg. payment_method_name/
-- payment_bank_name komen rechtstreeks van Mollie's payment.method en (bij
-- iDEAL) payment.details.consumerBic; payment_failure_reason komt alleen
-- van Mollie's eigen payment.details.failureReason (voornamelijk bij
-- geweigerde creditcardbetalingen) — deze kolom blijft bewust leeg als
-- Mollie zelf geen reden meegeeft, er wordt nooit een reden verzonnen. Voer
-- onderstaande drie regels ÉÉNMALIG uit in hetzelfde SQL-scherm om de tabel
-- bij te werken:

ALTER TABLE configurations ADD COLUMN payment_method_name VARCHAR(100) NULL;
ALTER TABLE configurations ADD COLUMN payment_bank_name VARCHAR(100) NULL;
ALTER TABLE configurations ADD COLUMN payment_failure_reason VARCHAR(255) NULL;

-- MIGRATIE 16-9-2026: kleurkeuzes uitgebreid (op verzoek van Christiaan). De
-- 4 oorspronkelijke vormen + het ovale model (colorMode "single") hadden tot
-- nu toe maar één kleur (color_id/color_name, hierboven al aanwezig) — dat
-- veld heet vanaf nu "Ondergrond kleur" (bepaalt de achtergrond) en krijgt
-- er een tweede, verplichte kleur naast: print_color_id/print_color_name,
-- de "Opdruk kleur" (bepaalt het huisnummer + eventuele tekstregels), uit
-- dezelfde kleurenlijst als color_id (productColors). Blijft NULL voor de 3
-- "oren"-vormen (colorMode "ears-and-plate") — die gebruiken voortaan
-- dezelfde "Ondergrond kleur"/"Opdruk kleur"-indeling via hun bestaande
-- plate_color_id/ear_color_id-kolommen (alleen de UI-labels/volgorde zijn
-- daar gewijzigd, geen nieuwe kolommen nodig). Voer onderstaande twee regels
-- ÉÉNMALIG uit in hetzelfde SQL-scherm om de tabel bij te werken:

ALTER TABLE configurations ADD COLUMN print_color_id VARCHAR(64) NULL AFTER color_name;
ALTER TABLE configurations ADD COLUMN print_color_name VARCHAR(100) NULL AFTER print_color_id;

-- MIGRATIE 17-9-2026: leveringskosten toegevoegd. Welke vervoerder en
-- verzendstaffel bij een bestelling horen, en wat de verzendkosten waren,
-- wordt volledig bepaald door de prijsbeheeromgeving op basis van het
-- gekozen product en de maat (zie lib/configuration/pricing.ts en
-- app/api/create-payment/route.ts) — de klant kiest hier zelf niets. De
-- kolommen bewaren, net als bij shape_name/color_name elders in deze
-- tabel, zowel de vervoerders-/staffelnaam als de prijs op het moment van
-- bestellen (in centen, zelfde eenheid als de overige price_*-kolommen),
-- zodat een oude bestelling altijd correct leesbaar blijft, ook als er
-- later iets in de vervoerderslijst verandert. Alle drie blijven NULL bij
-- een bestelling van vóór deze migratie. Voer onderstaande drie regels
-- ÉÉNMALIG uit in hetzelfde SQL-scherm om de tabel bij te werken:

ALTER TABLE configurations ADD COLUMN shipping_carrier_name VARCHAR(100) NULL;
ALTER TABLE configurations ADD COLUMN shipping_tier_name VARCHAR(100) NULL;
ALTER TABLE configurations ADD COLUMN shipping_cost_cents INT NULL;

-- MIGRATIE 19-9-2026: "Order handmatig bevestigen" in het beheertool, op
-- verzoek van Christiaan, voor het geval Mollie een betaling pas na een
-- opvallende vertraging als geslaagd doorgeeft (bijvoorbeeld een trage
-- bankbevestiging) — dan kan een beheerder de bestaande bevestigingsmails
-- (klant + webshop) alsnog handmatig opnieuw laten versturen.
--
-- BELANGRIJK, uitgezocht vóór deze migratie (zie het uitgebreide onderzoek
-- van diezelfde datum): de bestaande kolommen `created_at` en `paid_at`
-- hierboven zijn GEEN Mollie-timestamps — `created_at` wordt gezet vóórdat
-- de Mollie-betaling wordt aangemaakt (bij het opslaan van de nog niet
-- betaalde bestelling, zie app/api/create-payment/route.ts), en `paid_at`
-- is `NOW()` op het moment dat ONZE server de webhook verwerkt (zie
-- markOrderAsPaid in lib/mysql/client.ts) — niet het moment dat Mollie zelf
-- de betaling als geslaagd registreert. Voor een betrouwbare vertragings-
-- meting zijn daarom 2 NIEUWE kolommen nodig, rechtstreeks gevuld met
-- Mollie's eigen `payment.createdAt`/`payment.paidAt` (zie
-- lib/mollie/manualConfirmEligibility.ts voor de berekening die deze twee
-- vergelijkt, en app/api/create-payment/route.ts / app/api/mollie-webhook/
-- route.ts voor waar ze gevuld worden). Voor bestellingen van vóór deze
-- migratie blijven deze kolommen NULL — er is dan geen betrouwbare meting
-- mogelijk, en de knop "Order handmatig bevestigen" verschijnt dan bewust
-- niet (zie isEligibleForManualConfirmation).
--
-- manually_confirmed_at/manually_confirmed_by registreren de handmatige
-- bevestiging zelf. Er is in dit project geen apart inlogsysteem per
-- beheerder (zie middleware.js — één gedeeld wachtwoord voor iedereen), dus
-- manually_confirmed_by is een vrij ingevulde naam, geen geverifieerde
-- identiteit — op uitdrukkelijk verzoek van Christiaan bewust zo gehouden
-- (nog geen aparte beheerders-accounts).
--
-- Voer onderstaande vier regels ÉÉNMALIG uit in hetzelfde SQL-scherm om de
-- tabel bij te werken:

ALTER TABLE configurations ADD COLUMN mollie_created_at TIMESTAMP NULL;
ALTER TABLE configurations ADD COLUMN mollie_paid_at TIMESTAMP NULL;
ALTER TABLE configurations ADD COLUMN manually_confirmed_at TIMESTAMP NULL;
ALTER TABLE configurations ADD COLUMN manually_confirmed_by VARCHAR(100) NULL;

-- Aparte auditlogtabel voor elke (poging tot een) handmatige bevestiging —
-- blijft ook bewaard als een order ooit opnieuw bekeken/bevestigd zou
-- worden. Bevat expliciet GEEN klantgegevens (naam/adres/e-mail e.d.) — dat
-- staat al bij de order zelf, hier alleen wat nodig is om de actie achteraf
-- te kunnen controleren (op verzoek van Christiaan: "Log geen gevoelige
-- persoonsgegevens als dat niet noodzakelijk is").

CREATE TABLE IF NOT EXISTS manual_confirmation_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  mollie_payment_id VARCHAR(64) NULL,
  mollie_created_at TIMESTAMP NULL,
  mollie_paid_at TIMESTAMP NULL,
  delay_seconds INT NULL,
  confirmed_by VARCHAR(100) NOT NULL,
  confirmed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  internal_email_sent BOOLEAN NOT NULL DEFAULT FALSE,
  customer_email_sent BOOLEAN NOT NULL DEFAULT FALSE,
  error_message VARCHAR(500) NULL,

  INDEX idx_order_id (order_id)
);

-- MIGRATIE 19-9-2026 (aanvulling, later dezelfde dag): "handmatig bevestigen
-- zonder dat Mollie zelf 'betaald' meldt" toegevoegd, op verzoek van
-- Christiaan — voor een order die bij Mollie nog 'Open'/'pending' of
-- 'Verlopen'/'expired' staat, kan een beheerder eerst laten CONTROLEREN bij
-- Mollie zelf (dat kan de status alsnog bijwerken, zonder mails, of juist
-- alsnog tot een normale betaalbevestiging leiden) en, als de betaling dan
-- nog steeds niet bevestigd is, bewust een HANDMATIGE OVERSCHRIJVING
-- uitvoeren (de order alsnog als betaald behandelen en de bevestigingsmails
-- versturen, ook al zegt Mollie zelf van niet). Zie app/api/admin/
-- check-order-payment/route.ts en app/api/admin/force-confirm-order/route.ts.
--
-- Nadrukkelijk NIET toegestaan voor een order die Mollie als 'failed' of
-- 'canceled' meldt (dat is, anders dan 'open'/'pending'/'expired', een
-- ondubbelzinnige eindstatus) — zie isEligibleForForceConfirm in
-- lib/mollie/applyMolliePaymentStatus.ts.
--
-- mollie_status_at_confirmation registreert, voor ELKE regel in deze
-- auditlogtabel (dus ook de al bestaande, hierboven), wat Mollie op het
-- moment van bevestigen zelf als status teruggaf — bij de normale
-- (vertraagde) bevestiging altijd 'paid', bij een handmatige overschrijving
-- juist NIET 'paid' (bijvoorbeeld 'open' of 'expired'). Zo is achteraf altijd
-- te zien of een bevestiging een gewone, door Mollie bevestigde betaling was,
-- of een bewuste overschrijving. Voer onderstaande regel ÉÉNMALIG uit in
-- hetzelfde SQL-scherm om de tabel bij te werken:

ALTER TABLE manual_confirmation_log ADD COLUMN mollie_status_at_confirmation VARCHAR(20) NULL;
