import { NextResponse } from "next/server";

/**
 * POST /api/configuration
 * Slaat een bevestigde configuratie op in Supabase.
 * Volledige implementatie (server-side Zod-validatie + database-insert)
 * volgt in FASE 12.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Nog niet geïmplementeerd. Volgt in FASE 12." },
    { status: 501 }
  );
}
