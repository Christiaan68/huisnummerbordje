"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactDetailsSchema, type ContactDetails } from "@/lib/validation/contact.schema";
import { PaymentMethodIcons } from "@/components/layout/PaymentMethodIcons";
import { cn } from "@/lib/utils";
import { useConfigurator } from "@/lib/configuration/ConfiguratorContext";
import { usePricingData } from "@/lib/configuration/PricingDataContext";
import {
  calculatePrice,
  formatPriceCents,
  totalCentsForQuantity,
  MAX_QUANTITY,
} from "@/lib/configuration/pricing";

// Nederlandse postcode: 4 cijfers (niet beginnend met 0) + 2 letters, met of
// zonder spatie/hoofdletters — zelfde formaat als contactDetailsSchema
// hierboven accepteert.
const NL_POSTCODE_REGEX = /^[1-9][0-9]{3}\s?[A-Za-z]{2}$/;

interface ContactDetailsFormProps {
  onSubmit: (data: ContactDetails) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

function fieldClass(hasError: boolean) {
  return cn(
    "w-full rounded-sm border bg-secondary px-4 py-3 text-foreground outline-none",
    hasError ? "border-destructive" : "border-border focus:border-primary"
  );
}

export function ContactDetailsForm({
  onSubmit,
  onBack,
  isSubmitting,
}: ContactDetailsFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ContactDetails>({
    resolver: zodResolver(contactDetailsSchema),
    // Bewust GEEN "mode: onChange" — dat zou (via formState.errors) meteen
    // bij elke toetsaanslag rode randen/foutmeldingen bij de losse vakjes
    // laten verschijnen, ook vóór een eerste poging tot versturen. Dat
    // gedrag bestond niet eerder en moet ook niet ontstaan (Christiaan,
    // 29-8-2026: "dat moet niet en dat moet zo blijven als het was"). De
    // losse vakjes valideren dus nog steeds zoals altijd: pas na een eerste
    // klik op "Bestel en betaal", en daarna live. Zie canSubmit
    // hieronder voor hoe de knop wél live meekleurt, zonder dat gedrag aan
    // te raken.
    defaultValues: {
      name: "",
      address: "",
      postalCode: "",
      city: "",
      email: "",
      phone: "",
      quantity: "",
    },
  });

  // Akkoord met leveringsvoorwaarden/retourbeleid — bewust géén onderdeel
  // van contactDetailsSchema/ContactDetails: dat type wordt ook gebruikt
  // als payload naar /api/create-payment, en dit is puur een blokkade in de
  // browser vóór het doorgaan naar de betaalpagina, geen gegeven dat
  // opgeslagen/gemaild hoeft te worden.
  const [agreed, setAgreed] = useState(false);
  const [agreedError, setAgreedError] = useState(false);

  // Tweede, apart verplicht vinkje (15-9-2026, verzoek Christiaan) — net als
  // "agreed" hierboven bewust GEEN onderdeel van contactDetailsSchema (puur
  // een blokkade in de browser, geen gegeven dat opgeslagen/gemaild hoeft te
  // worden). Los van het vergelijkbare vinkje op de vorige stap ("Controle",
  // zie app/configurator/controle/page.tsx) — dat bevestigt de configuratie,
  // dit bevestigt de bestelling zelf.
  const [understandsHandmade, setUnderstandsHandmade] = useState(false);
  const [understandsError, setUnderstandsError] = useState(false);

  // Voor de kleur van de "Bestel en betaal"-knop (zie canSubmit
  // hieronder) wordt HIER, los van react-hook-form's eigen foutmeldingen-
  // systeem, apart en stil gecontroleerd of het formulier al compleet is —
  // met dezelfde `contactDetailsSchema` als de echte validatie, maar zonder
  // formState.errors aan te raken. Zo reageert alleen de knop live mee
  // terwijl de losse vakjes (rode rand + foutmelding) exact hetzelfde
  // gedrag houden als voorheen.
  const watchedValues = watch();
  const quantityField = register("quantity");

  // Totaal voor het gekozen aantal (besluit A1, testrapport 22-11-2026):
  // bordprijs × aantal, verzendkosten één keer. Zelfde berekening als de
  // server (app/api/create-payment/route.ts), zodat het bedrag hier gelijk
  // is aan het bedrag bij Mollie.
  const { selection } = useConfigurator();
  const pricingData = usePricingData();
  const unitPrice = calculatePrice(selection, pricingData);
  const quantityNumber = Number(watchedValues.quantity);
  const quantityIsValid =
    /^[0-9]+$/.test(watchedValues.quantity ?? "") &&
    quantityNumber >= 1 &&
    quantityNumber <= MAX_QUANTITY;
  const isFormComplete = contactDetailsSchema.safeParse(watchedValues).success;
  const canSubmit = isFormComplete && agreed && understandsHandmade;

  // Straat + huisnummer opgesplitst in de UI (op verzoek van Christiaan,
  // 9-9-2026) — maar het onderliggende formulierveld blijft gewoon het
  // bestaande, enkelvoudige "address" (straat + huisnummer samen), zodat er
  // verder NERGENS anders iets hoeft te veranderen (validatie, opslag,
  // e-mails, beheertool blijven één "adres"-veld verwachten, precies zoals
  // vóór deze wijziging). "street" hieronder is dus puur lokale UI-state,
  // niet rechtstreeks een formuliervel — bij elke wijziging van straat of
  // huisnummer wordt het samengestelde geheel via setValue("address", …)
  // in het echte formulierveld gezet (zie de twee useEffects verderop).
  //
  // 13-9-2026, n.a.v. een test op de telefoon door een tester: de
  // opzoekactie ging tot dan toe op basis van postcode ÉN huisnummer samen,
  // waardoor een klant eerst het huisnummer moest intypen voordat straat/
  // plaats werden opgezocht — verwarrend, want het huisnummer hoort er pas
  // ná straat/plaats bij te komen. Sinds de overstap naar de PDOK
  // Locatieserver (zie app/api/postcode-lookup/route.ts) kan er al op
  // postcode ALLEEN gezocht worden — het huisnummer is dus geen vereiste
  // meer voor deze opzoekactie, en blijft verder gewoon een eigen, apart in
  // te vullen vakje.
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  // "idle": nog niet (genoeg) ingevuld om iets op te zoeken. "loading":
  // opzoekactie loopt. "found"/"not-found": laatste opzoekactie is klaar en
  // heeft wel/niet iets gevonden — expliciet bijgehouden (in plaats van
  // alleen een simpele aan/uit-spinner) zodat Christiaan/de klant ook ziet
  // wanneer een opzoekactie NIETS heeft gevonden, in plaats van dat het
  // stil niets lijkt te doen (feedback n.a.v. test 9-9-2026).
  const [lookupStatus, setLookupStatus] = useState<
    "idle" | "loading" | "found" | "not-found"
  >("idle");
  // Voorkomt een dubbele opzoekactie voor dezelfde postcode (bv. als de
  // klant nog even doortypt/de cursor verplaatst zonder de postcode zelf te
  // wijzigen) en voorkomt dat een trage, oude opzoekactie een inmiddels
  // ingetypte, nieuwere postcode overschrijft (zie de "genegeerd"-check in
  // de effect hieronder).
  const lastLookedUpKey = useRef<string | null>(null);

  // B6 (testrapport 22-11-2026): de opzoekactie mag nooit straat/plaats
  // overschrijven die de klant zelf heeft ingetypt. Daarom onthouden we wat
  // de opzoekactie de vorige keer zelf heeft ingevuld: alleen DIE waarden
  // (of lege velden) worden gewist of vervangen.
  const streetRef = useRef("");
  const autoFilled = useRef<{ street: string; city: string }>({ street: "", city: "" });

  const postalCodeValue = watch("postalCode");

  useEffect(() => {
    const normalizedPostcode = postalCodeValue.replace(/\s+/g, "").toUpperCase();

    if (!NL_POSTCODE_REGEX.test(postalCodeValue)) {
      setLookupStatus("idle");
      return;
    }

    const key = normalizedPostcode;
    if (key === lastLookedUpKey.current) return;

    // Klein debounce-moment: pas opzoeken nadat de klant heeft opgehouden
    // met typen, niet bij elke toetsaanslag.
    const timeoutId = setTimeout(async () => {
      lastLookedUpKey.current = key;
      setLookupStatus("loading");
      // Nieuwe opzoekactie voor een ANDERE postcode gestart: de oude,
      // mogelijk niet meer kloppende straat/plaats van de vórige postcode
      // meteen wissen. Zonder dit bleef er bij het corrigeren van een
      // postcode een verouderd straat/plaats-resultaat van de eerdere
      // (foute) postcode zichtbaar staan, wat de indruk gaf dat het
      // corrigeren niet werkte (gemeld door een tester, 13-9-2026).
      if (streetRef.current === autoFilled.current.street) setStreet("");
      if (getValues("city") === autoFilled.current.city) {
        setValue("city", "", { shouldValidate: false });
      }
      try {
        const res = await fetch(
          `/api/postcode-lookup?postcode=${encodeURIComponent(normalizedPostcode)}`
        );
        const data: { found: boolean; street?: string; city?: string } =
          await res.json();
        // Als de postcode intussen alweer gewijzigd is (klant typte door
        // terwijl dit verzoek liep), dit resultaat negeren — anders zou een
        // trage, verouderde opzoekactie de inmiddels nieuwere postcode
        // kunnen overschrijven.
        if (lastLookedUpKey.current !== key) return;
        if (data.found && data.street && data.city) {
          if (streetRef.current === "" || streetRef.current === autoFilled.current.street) {
            setStreet(data.street);
            autoFilled.current.street = data.street;
          }
          const currentCity = getValues("city");
          if (currentCity === "" || currentCity === autoFilled.current.city) {
            setValue("city", data.city, { shouldValidate: false });
            autoFilled.current.city = data.city;
          }
          setLookupStatus("found");
        } else {
          // Niet gevonden (onbekende postcode, opzoekdienst niet
          // bereikbaar): straat/plaats blijven leeg — de klant typt ze dan
          // zelf in. Wel duidelijk maken dát er niets gevonden is (zie
          // "not-found" hieronder in de JSX), in plaats van stil niets te
          // doen.
          setLookupStatus("not-found");
        }
      } catch {
        if (lastLookedUpKey.current === key) setLookupStatus("not-found");
      }
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postalCodeValue]);

  // Straat + huisnummer samenvoegen tot het bestaande "address"-veld, bij
  // elke wijziging van één van beide (zowel handmatig getypt als
  // automatisch ingevuld via de opzoekactie hierboven).
  useEffect(() => {
    streetRef.current = street;
    setValue("address", `${street} ${houseNumber}`.trim(), {
      shouldValidate: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [street, houseNumber]);

  function handleValidSubmit(data: ContactDetails) {
    // Beide vinkjes los gecontroleerd (i.p.v. alleen bij canSubmit stoppen)
    // zodat, als er meer dan één ontbreekt, ook meteen bij allebei de
    // foutmelding verschijnt — net als het bestaande "agreed"-gedrag.
    let blocked = false;
    if (!agreed) {
      setAgreedError(true);
      blocked = true;
    }
    if (!understandsHandmade) {
      setUnderstandsError(true);
      blocked = true;
    }
    if (blocked) return;
    onSubmit(data);
  }

  return (
    <form
      onSubmit={handleSubmit(handleValidSubmit)}
      className="max-w-sm space-y-5"
      autoComplete="on"
    >
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-foreground">
          Naam
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          {...register("name")}
          className={fieldClass(!!errors.name)}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Uitleg vooraf, op verzoek van Christiaan (9-9-2026): moet vooraf
          duidelijk zijn dát de postcode de straat/plaats automatisch
          invult, niet iets dat de klant per ongeluk moet ontdekken. Tekst
          13-9-2026 aangepast: het huisnummer is niet langer nodig om de
          opzoekactie te laten starten (zie de toelichting bij de
          opzoekactie hierboven), dus dat wordt hier niet meer genoemd als
          iets wat je "eerst" moet doen. */}
      <p className="-mb-1 text-xs text-muted-foreground">
        Vul je postcode in — straat en plaats vullen we dan automatisch voor je in. Het huisnummer vul je er zelf bij in.
      </p>

      <div className="grid grid-cols-[1fr_auto] gap-4">
        <div>
          <label htmlFor="postalCode" className="mb-1.5 block text-sm font-medium text-foreground">
            Postcode
          </label>
          <input
            id="postalCode"
            type="text"
            inputMode="text"
            placeholder="1234 AB"
            autoComplete="postal-code"
            {...register("postalCode")}
            className={fieldClass(!!errors.postalCode)}
          />
          {errors.postalCode && (
            <p className="mt-1 text-sm text-destructive">{errors.postalCode.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="houseNumber" className="mb-1.5 block text-sm font-medium text-foreground">
            Huisnummer
          </label>
          <input
            id="houseNumber"
            type="text"
            placeholder="12A"
            autoComplete="address-line2"
            value={houseNumber}
            onChange={(event) => setHouseNumber(event.target.value)}
            className={cn(fieldClass(!!errors.address), "w-24")}
          />
        </div>
      </div>

      {/* Straat + woonplaats: worden automatisch ingevuld zodra hierboven
          zowel een geldige postcode als een huisnummer zijn getypt (zie de
          opzoekactie hogerop in dit bestand) — blijven altijd gewoon zelf
          aan te passen, voor het (zeldzame) geval dat de opzoekactie niets/
          iets verkeerds vindt, of wanneer de opzoekdienst niet beschikbaar
          is. */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="street" className="mb-1.5 block text-sm font-medium text-foreground">
            Straat
            {lookupStatus === "loading" && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                bezig met opzoeken…
              </span>
            )}
            {lookupStatus === "not-found" && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                niet gevonden — vul zelf in
              </span>
            )}
          </label>
          <input
            id="street"
            type="text"
            autoComplete="address-line1"
            value={street}
            onChange={(event) => setStreet(event.target.value)}
            className={fieldClass(!!errors.address)}
          />
          {errors.address && (
            <p className="mt-1 text-sm text-destructive">{errors.address.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="city" className="mb-1.5 block text-sm font-medium text-foreground">
            Woonplaats
          </label>
          <input
            id="city"
            type="text"
            autoComplete="address-level2"
            {...register("city")}
            className={fieldClass(!!errors.city)}
          />
          {errors.city && (
            <p className="mt-1 text-sm text-destructive">{errors.city.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
          E-mailadres
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
          className={fieldClass(!!errors.email)}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-foreground">
          Telefoonnummer <span className="text-muted-foreground">(optioneel)</span>
        </label>
        <input
          id="phone"
          type="tel"
          autoComplete="tel"
          {...register("phone")}
          className={fieldClass(!!errors.phone)}
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-destructive">{errors.phone.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="quantity" className="mb-1.5 block text-sm font-medium text-foreground">
          Aantal
        </label>
        <input
          id="quantity"
          type="text"
          inputMode="numeric"
          maxLength={2}
          {...quantityField}
          // C4 (testrapport 22-11-2026): alleen cijfers laten intypen.
          onChange={(event) => {
            event.target.value = event.target.value.replace(/\D/g, "");
            quantityField.onChange(event);
          }}
          className={cn(fieldClass(!!errors.quantity), "w-24")}
        />
        {errors.quantity && (
          <p className="mt-1 text-sm text-destructive">{errors.quantity.message}</p>
        )}
        {!errors.quantity && (
          // Op tablet/desktop op één regel, ook als die iets breder is dan
          // het formulier; op een telefoon mag hij gewoon doorlopen.
          <p className="mt-1 text-sm text-muted-foreground sm:whitespace-nowrap">
            {quantityIsValid && unitPrice
              ? `Totaal voor ${quantityNumber} ${quantityNumber === 1 ? "stuk" : "stuks"}: ${formatPriceCents(
                  totalCentsForQuantity(unitPrice, quantityNumber)
                )} (verzendkosten ${formatPriceCents(unitPrice.shippingCostCents)} één keer).`
              : `1 tot en met ${MAX_QUANTITY} stuks.`}
          </p>
        )}
      </div>

      {/* Volgorde van deze twee vinkjes op verzoek van Christiaan (15-9-2026)
          omgedraaid: "met de hand gemaakt" staat nu boven het akkoord-vinkje
          met de leveringsvoorwaarden. */}
      <div>
        <label htmlFor="understandsHandmade" className="flex items-start gap-3">
          <input
            id="understandsHandmade"
            type="checkbox"
            checked={understandsHandmade}
            onChange={(event) => {
              setUnderstandsHandmade(event.target.checked);
              if (event.target.checked) setUnderstandsError(false);
            }}
            aria-describedby={
              understandsError
                ? "understandsHandmade-guarantee understandsHandmade-error"
                : "understandsHandmade-guarantee"
            }
            aria-invalid={understandsError}
            className="mt-0.5 h-4 w-4 shrink-0 rounded-sm border-border text-primary accent-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
          <span className="text-sm text-muted-foreground">
            Mijn Huisnummerbord wordt met de hand gemaakt en kan iets
            afwijken van de preview.
          </span>
        </label>
        {/* Wettelijke garantie (23-11-2026, variant B op verzoek van
            Christiaan): bewust NIET in de vinkregel, want de klant gaat
            niet "akkoord" met de garantie — het is een recht. Ingesprongen
            onder de vinkregel (ml-7 = vakje + tussenruimte). */}
        <p
          id="understandsHandmade-guarantee"
          className="-mt-1 ml-7 text-xs leading-relaxed text-muted-foreground/80"
        >
          Natuurlijk geldt ook voor je maatwerk-huisnummerbord de wettelijke
          garantie. Is er door een fout van onze kant iets niet in orde, dan heb
          je, afhankelijk van de situatie, recht op kosteloos herstel,
          vervanging, prijsvermindering of ontbinding. Een aparte, langere
          garantie bieden we daarnaast niet.
        </p>
        {understandsError && (
          <p
            id="understandsHandmade-error"
            role="alert"
            className="mt-1.5 pl-7 text-sm text-destructive"
          >
            Vink dit aan om je bestelling te kunnen plaatsen.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="agreesToTerms" className="flex items-start gap-3">
          <input
            id="agreesToTerms"
            type="checkbox"
            checked={agreed}
            onChange={(event) => {
              setAgreed(event.target.checked);
              if (event.target.checked) setAgreedError(false);
            }}
            aria-describedby={agreedError ? "agreesToTerms-error" : undefined}
            aria-invalid={agreedError}
            className="mt-0.5 h-4 w-4 shrink-0 rounded-sm border-border text-primary accent-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
          <span className="text-sm text-muted-foreground">
            Ik ga akkoord met de{" "}
            <Link
              href="/leveringsvoorwaarden"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4 hover:text-primary"
            >
              leveringsvoorwaarden
            </Link>{" "}
            en het{" "}
            <Link
              href="/retourneren-reclameren"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4 hover:text-primary"
            >
              retourbeleid
            </Link>{" "}
            en heb deze kunnen inzien.
          </span>
        </label>
        {agreedError && (
          <p id="agreesToTerms-error" role="alert" className="mt-1.5 pl-7 text-sm text-destructive">
            Vink dit aan om je bestelling te kunnen plaatsen.
          </p>
        )}
      </div>

      {/* Betaalmethodes (31-8-2026, op verzoek van Christiaan) — hier, vlak
          boven de knop, op het moment dat het er voor de klant echt toe
          doet. Zie ook Footer.tsx voor dezelfde rij als algemene
          geruststelling op elke pagina, en de `method`-beperking in
          app/api/create-payment/route.ts die ervoor zorgt dat Mollie ook
          daadwerkelijk alleen deze 3 methodes aanbiedt. */}
      <div className="border-t border-border pt-6">
        <p className="mb-2 text-xs text-muted-foreground">Veilig betalen met:</p>
        <PaymentMethodIcons />
      </div>

      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Terug
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          // Bewust NIET disabled zolang het formulier nog niet compleet is
          // (canSubmit === false) — een klik doet dan gewoon de normale
          // validatie lopen en toont de ontbrekende/foutieve velden (incl.
          // de melding onder het akkoordvakje), in plaats van dat de knop
          // een dode, niet-klikbare knop lijkt. Alleen de kleur verandert.
          className={cn(
            "inline-flex items-center justify-center rounded-sm px-8 py-4 text-sm font-medium text-primary-foreground transition-colors disabled:opacity-60",
            canSubmit ? "bg-primary hover:bg-primary/90" : "bg-primary/40 hover:bg-primary/50"
          )}
        >
          {isSubmitting ? "Bezig..." : "Bestel en betaal"}
        </button>
      </div>
    </form>
  );
}
