"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import {
  clearGoogleAnalyticsCookies,
  parseConsentCookie,
  writeConsentCookieClient,
  type ConsentPreferences,
} from "@/lib/consent/consent";

// Meet-ID van de webshop-property in Google Analytics 4 (toegevoegd
// 27-8-2026). Geen geheime sleutel — dit ID staat sowieso altijd
// zichtbaar in de paginabroncode, zie ook claude/project-tijdlijn.md.
const GA_MEASUREMENT_ID = "G-2NLDPWQQ92";

type ConsentStatus = "unset" | "set";

interface ConsentContextValue {
  /** "unset": nog geen keuze gemaakt -> banner moet getoond worden. */
  status: ConsentStatus;
  analytics: boolean;
  isPreferencesOpen: boolean;
  openPreferences: () => void;
  closePreferences: () => void;
  acceptAll: () => void;
  acceptNecessaryOnly: () => void;
  rejectAll: () => void;
  savePreferences: (prefs: ConsentPreferences) => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    throw new Error(
      "useConsent() moet binnen een <ConsentProvider> gebruikt worden."
    );
  }
  return ctx;
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function updateGtagAnalyticsConsent(granted: boolean) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }
  window.gtag("consent", "update", {
    analytics_storage: granted ? "granted" : "denied",
  });
}

/**
 * Houdt de cookie-toestemming van de bezoeker bij (Context) en regelt
 * Google Consent Mode voor Google Analytics 4 (toegevoegd 27-8-2026, zie
 * claude/project-tijdlijn.md voor de volledige achtergrond).
 *
 * Werking in het kort:
 * - In app/layout.tsx staat, vóórdat React laadt, een klein scriptje dat
 *   `gtag('consent', 'default', { ...alles op 'denied' })` aanroept —
 *   dat gebeurt dus nog vóórdat dit component actief wordt.
 * - Dit component initialiseert daarna zijn eigen state uit de eerder
 *   opgeslagen cookie (server-side meegegeven via `initialConsentRaw`,
 *   zodat er geen flits van de banner ontstaat bij een bezoeker die al
 *   eerder een keuze maakte).
 * - <GoogleAnalytics gaId=... /> staat hieronder ALTIJD gerenderd (dat is
 *   de door Google/Next.js aanbevolen aanpak, "Consent Mode"): de GA4-tag
 *   laadt gewoon, maar zet zelf geen cookies en verstuurt geen
 *   identificeerbare data zolang `analytics_storage` op 'denied' staat.
 *   Pas na een 'update' naar 'granted' (via acceptAll/savePreferences
 *   hieronder) begint GA4 daadwerkelijk te meten.
 * - Bij intrekken van toestemming wordt zowel de gtag-status bijgewerkt
 *   (stopt nieuwe metingen) als worden bestaande _ga-cookies actief
 *   verwijderd (ruimt op wat er eventueel al stond).
 *
 * Bewust GEEN aparte marketing-toggle: er is geen enkele
 * marketing-/advertentietracking in deze webshop aangetroffen (zie
 * app/cookiebeleid). Komt die er later wel (bv. Google Ads), voeg dan
 * hier een vergelijkbare `marketing`-state toe en koppel die aan
 * `ad_storage`/`ad_user_data`/`ad_personalization` in plaats van ze
 * (zoals nu) permanent op 'denied' te laten staan.
 */
export function ConsentProvider({
  children,
  initialConsentRaw,
}: {
  children: ReactNode;
  initialConsentRaw: string | null;
}) {
  const initialStored = useMemo(
    () => parseConsentCookie(initialConsentRaw),
    [initialConsentRaw]
  );

  const [status, setStatus] = useState<ConsentStatus>(
    initialStored ? "set" : "unset"
  );
  const [analytics, setAnalytics] = useState<boolean>(
    initialStored?.analytics ?? false
  );
  const [isPreferencesOpen, setPreferencesOpen] = useState(false);

  // Het "consent-default"-scriptje in app/layout.tsx geeft een reeds
  // bekende toestemming ook al meteen, synchroon, door aan gtag (zie de
  // toelichting daar). Deze useEffect is een extra, correcte doorgave
  // voor het geval de pagina later opnieuw rendert met een andere
  // (server-side) beginwaarde — bijvoorbeeld na navigatie.
  useEffect(() => {
    if (initialStored) {
      updateGtagAnalyticsConsent(initialStored.analytics);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persist(prefs: ConsentPreferences) {
    writeConsentCookieClient(prefs);
    setAnalytics(prefs.analytics);
    setStatus("set");
    updateGtagAnalyticsConsent(prefs.analytics);
    if (!prefs.analytics) {
      clearGoogleAnalyticsCookies();
    }
    setPreferencesOpen(false);
  }

  const value: ConsentContextValue = {
    status,
    analytics,
    isPreferencesOpen,
    openPreferences: () => setPreferencesOpen(true),
    closePreferences: () => setPreferencesOpen(false),
    acceptAll: () => persist({ analytics: true }),
    acceptNecessaryOnly: () => persist({ analytics: false }),
    rejectAll: () => persist({ analytics: false }),
    savePreferences: (prefs) => persist(prefs),
  };

  return (
    <ConsentContext.Provider value={value}>
      {children}
      {/* Zie de toelichting hierboven: dit component staat altijd
          gerenderd, Google Consent Mode regelt of er daadwerkelijk iets
          gemeten/opgeslagen wordt. */}
      <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
    </ConsentContext.Provider>
  );
}
