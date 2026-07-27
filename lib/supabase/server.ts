import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase-client voor gebruik in Server Components, Route Handlers en
 * Server Actions. Gebruikt de service role key en mag NOOIT naar de
 * browser worden gestuurd of in client-code worden geïmporteerd.
 */
export function createServerSupabaseClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Kan genegeerd worden wanneer aangeroepen vanuit een Server Component
            // met alleen-lezen cookiestore (bv. tijdens statische rendering).
          }
        },
      },
    }
  );
}