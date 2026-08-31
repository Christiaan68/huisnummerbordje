import { NextResponse } from "next/server";
import { createConfigurationSchema } from "@/lib/validation/configuration.schema";
import { contactDetailsSchema } from "@/lib/validation/contact.schema";
import { calculatePrice } from "@/lib/configuration/pricing";
import { getLivePricingData } from "@/lib/configuration/livePricing";
import { saveOrderToDatabase, setOrderMolliePaymentId } from "@/lib/mysql/client";
import { buildOrderLabel } from "@/lib/configuration/orderLabel";
import { createMollie, getSiteUrl } from "@/lib/mollie/client";
import {
  productShapes,
  productColors,
  productFonts,
} from "@/config/product-options";

/**
 * Eerste stap van het betaalproces (toegevoegd 29-8-2026, ter vervanging
 * van het voorheen hier aanwezige app/api/send-email/route.ts, dat direct
 * — zonder te betalen — de bestelling bevestigde). Wordt aangeroepen zodra
 * de klant in de "Controle"-stap van de configurator zijn gegevens
 * bevestigt (zie app/configurator/controle/page.tsx).
 *
 * Doet, in deze volgorde: (1) dezelfde validatie en server-side
 * prijsberekening als voorheen — de prijs die de klant straks bij Mollie
 * ziet, komt dus nooit van de klant zelf; (2) slaat de bestelling alvast in
 * de database op, met payment_status 'pending' (nog geen mail verstuurd —
 * dat gebeurt pas ná een bevestigde betaling, zie app/api/mollie-webhook/
 * route.ts); (3) maakt bij Mollie een betaling aan voor exact dat bedrag;
 * (4) geeft de betaal-URL van Mollie terug, waar de browser van de klant
 * naartoe gestuurd wordt.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Ongeldige aanvraag: geen geldige JSON." },
      { status: 400 }
    );
  }

  const parsed = createConfigurationSchema.safeParse(body);
  const parsedContact = contactDetailsSchema.safeParse(body);

  if (!parsed.success || !parsedContact.success) {
    const issues = [
      ...(parsed.success ? [] : parsed.error.issues),
      ...(parsedContact.success ? [] : parsedContact.error.issues),
    ];
    return NextResponse.json(
      {
        error: "Validatie mislukt.",
        issues: issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const contact = parsedContact.data;

  const pricingData = await getLivePricingData();

  const shape = productShapes.find((s) => s.id === data.shapeId);
  const color = productColors.find((c) => c.id === data.colorId);
  const size = pricingData.productSizes.find((s) => s.id === data.sizeId);
  const numberFont = productFonts.find((f) => f.id === data.numberFontId);
  const line1Font = data.line1FontId
    ? productFonts.find((f) => f.id === data.line1FontId)
    : undefined;
  const line2Font = data.line2FontId
    ? productFonts.find((f) => f.id === data.line2FontId)
    : undefined;

  if (
    !shape ||
    !color ||
    !size ||
    !numberFont ||
    (shape.extraLines >= 1 && !line1Font) ||
    (shape.extraLines >= 2 && !line2Font)
  ) {
    return NextResponse.json(
      { error: "Onbekende vorm, kleur, maat of lettertype." },
      { status: 400 }
    );
  }

  const orderLabel = buildOrderLabel(shape, data.numberPosition);
  const price = calculatePrice(data, pricingData);

  // Zonder een bekende prijs kan er niets bij Mollie in rekening gebracht
  // worden — anders dan vroeger (toen ging de bestelling er ook zonder
  // bekende prijs gewoon door, met "prijs op aanvraag" in de mail) is dat
  // nu geen optie meer: er moet altijd een concreet bedrag betaald worden.
  if (price === null || price.totalCents == null || price.totalCents <= 0) {
    return NextResponse.json(
      {
        error:
          "Voor deze combinatie is de prijs nog niet bekend, dus kunnen we 'm nog niet laten betalen. Gebruik het contactformulier (\"Stel een vraag\") om 'm alsnog bij ons aan te vragen.",
      },
      { status: 400 }
    );
  }

  const priceFields = {
    priceTotalCents: price.totalCents,
    priceColorSurchargeCents: price.colorSurchargeCents,
    priceExtraCharsCents: price.extraCharsCents,
    priceExtraCharsCount: price.extraCharsCount,
    priceFrameSurchargeCents: price.frameSurchargeCents,
  };

  let orderId: number;
  try {
    orderId = await saveOrderToDatabase({
      shapeId: shape.id,
      shapeName: shape.name,
      finish: data.finish,
      colorId: color.id,
      colorName: color.name,
      sizeId: size.id,
      sizeName: size.name,
      numberFontId: numberFont.id,
      numberFontName: numberFont.name,
      line1FontId: line1Font?.id ?? null,
      line1FontName: line1Font?.name ?? null,
      line2FontId: line2Font?.id ?? null,
      line2FontName: line2Font?.name ?? null,
      customText: data.customText,
      extraLine1: data.extraLine1 || null,
      extraLine2: data.extraLine2 || null,
      numberPosition: data.numberPosition,
      hasFrame: data.hasFrame,
      priceSource: pricingData.bron,
      contactName: contact.name,
      contactAddress: contact.address,
      contactPostalCode: contact.postalCode,
      contactCity: contact.city,
      contactEmail: contact.email,
      contactPhone: contact.phone || null,
      quantity: contact.quantity,
      ...priceFields,
    });
  } catch (err) {
    console.error(
      "Opslaan van de (nog niet betaalde) bestelling is mislukt:",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { error: "Er ging iets mis op de server. Probeer het opnieuw." },
      { status: 500 }
    );
  }

  try {
    const siteUrl = getSiteUrl();
    const mollie = createMollie();

    const payment = await mollie.payments.create({
      amount: {
        currency: "EUR",
        value: (priceFields.priceTotalCents / 100).toFixed(2),
      },
      description: `Huisnummerbordje bestelling #${orderId}`,
      redirectUrl: `${siteUrl}/bestelling/bedankt?order=${orderId}`,
      webhookUrl: `${siteUrl}/api/mollie-webhook`,
      metadata: { orderId: String(orderId) },
      // Op verzoek van Christiaan (31-8-2026) beperkt tot deze
      // betaalmethodes — zonder dit veld toont Mollie's betaalpagina ALLE
      // methodes die in het Mollie-account geactiveerd staan. Zie ook
      // components/layout/PaymentMethodIcons.tsx, dat dezelfde methodes
      // (los, als informatie vooraf) aan de klant toont op de webshop
      // zelf — deze twee plekken moeten dus bij elkaar blijven passen als
      // dit ooit wijzigt.
      //
      // "applepay" staat hier BEWUST nog niet bij: Christiaan heeft Apple
      // Pay nog niet geactiveerd in Mollie (dat kan pas zodra het
      // Mollie-account volledig gevalideerd is) — voeg "applepay" pas aan
      // deze array toe (en aan PAYMENT_METHODS in PaymentMethodIcons.tsx)
      // zodra dat wél zo is.
      //
      // De "as any" hieronder: @mollie/api-client verwacht hier zijn
      // eigen `PaymentMethod`-type, maar exporteert dat type zelf niet
      // publiek (dus niet los te importeren/te gebruiken) — vandaar dat
      // Vercel's typecontrole struikelde over kale tekst als "ideal"
      // (31-8-2026, twee mislukte deploys; foutmelding: Type '"ideal"' is
      // not assignable to type 'PaymentMethod'). De waarden hieronder
      // ("ideal", "creditcard") zijn wel exact wat Mollie's eigen API en
      // dit pakket intern verwachten — alleen de TypeScript-typecontrole
      // kan het (door die ontbrekende export) niet zelf bevestigen.
      method: ["ideal", "creditcard"] as any,
    });

    await setOrderMolliePaymentId(orderId, payment.id);

    const checkoutUrl = payment._links.checkout?.href;
    if (!checkoutUrl) {
      throw new Error("Mollie gaf geen betaal-URL terug.");
    }

    return NextResponse.json({ checkoutUrl, orderId });
  } catch (err) {
    // De bestelling staat inmiddels wel al (als 'pending') in de database —
    // dat is geen probleem: zonder een geslaagde betaling gaat er nooit een
    // mail uit, en zo'n "wees" rij is onschadelijk (evt. later handmatig op
    // te ruimen). We loggen dit duidelijk, zodat het in de Vercel-
    // functielogs terug te vinden is als het vaker gebeurt.
    console.error(
      "Aanmaken van de Mollie-betaling is mislukt:",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      {
        error:
          "Kon geen betaling starten. Probeer het opnieuw, of neem contact met ons op als dit blijft gebeuren.",
      },
      { status: 502 }
    );
  }
}
