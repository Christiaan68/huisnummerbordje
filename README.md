# Emaille Huisnummerbordjes — Configurator

Next.js-webshop met configurator voor gepersonaliseerde geëmailleerde
huisnummerbordjes.

## Lokaal starten

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open daarna [http://localhost:3000](http://localhost:3000).

## Achtergrondafbeelding toevoegen (homepage)

De hero-sectie van de homepage verwacht een achtergrondafbeelding op:

```
public/images/hero-background.jpg
```

Plaats hier een foto (bijvoorbeeld van een gevel met een emaille bordje, of
een sfeerfoto passend bij ambacht/emaille). Zonder deze afbeelding valt de
pagina automatisch terug op het donkere basisfond — de site blijft dus
gewoon werken als het bestand ontbreekt.

Wil je een andere bestandsnaam of pad gebruiken? Pas dit aan in
`config/site-content.ts`, veld `hero.backgroundImage`.

## Projectfases

Dit project wordt in fases opgebouwd. Zie de projectgeschiedenis voor de
volledige architectuur. Huidige status: FASE 2 (homepage) afgerond.
