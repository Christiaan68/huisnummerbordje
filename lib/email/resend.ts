import { Resend } from "resend";

/**
 * Resend-client voor het versturen van e-mails.
 * Gebruikt alleen server-side (API routes) — nooit importeren in
 * client-componenten, want de API-key mag nooit naar de browser.
 */
export function createResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY ontbreekt. Zet deze in .env.local (zie .env.example)."
    );
  }
  return new Resend(apiKey);
}