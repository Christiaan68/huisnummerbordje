import { describe, it, expect } from "vitest";
import {
  isEligibleForManualConfirmation,
  getMollieDelayMs,
  getMollieDelaySeconds,
  parseMollieTimestamp,
  MANUAL_CONFIRM_THRESHOLD_MS,
} from "./manualConfirmEligibility";

/**
 * Tests voor "Order handmatig bevestigen" (toegevoegd 19-9-2026), op
 * uitdrukkelijk verzoek van Christiaan — dekt precies de grensgevallen die
 * hij zelf benoemde: <8s, exact 8s, >8s, niet betaald, ontbrekende/ongeldige
 * timestamps, en al eerder bevestigd. Deze module rekent puur op
 * timestamps (geen database/Mollie-verbinding nodig), dus deze tests draaien
 * volledig geïsoleerd.
 */

const CREATED = "2026-09-19T10:00:00.000Z";

/** Bouwt een ISO-timestamp die precies `seconds` na CREATED ligt. */
function paidAfter(seconds: number): string {
  return new Date(new Date(CREATED).getTime() + seconds * 1000).toISOString();
}

describe("isEligibleForManualConfirmation", () => {
  it("is niet in aanmerking bij een verschil kleiner dan 8 seconden", () => {
    const result = isEligibleForManualConfirmation({
      paymentStatus: "paid",
      mollieCreatedAt: CREATED,
      molliePaidAt: paidAfter(7.9),
      alreadyConfirmed: false,
    });
    expect(result).toBe(false);
  });

  it("is niet in aanmerking bij EXACT 8,0 seconden (strikt groter dan vereist)", () => {
    const result = isEligibleForManualConfirmation({
      paymentStatus: "paid",
      mollieCreatedAt: CREATED,
      molliePaidAt: paidAfter(MANUAL_CONFIRM_THRESHOLD_MS / 1000),
      alreadyConfirmed: false,
    });
    expect(result).toBe(false);
  });

  it("is wel in aanmerking bij een verschil groter dan 8 seconden", () => {
    const result = isEligibleForManualConfirmation({
      paymentStatus: "paid",
      mollieCreatedAt: CREATED,
      molliePaidAt: paidAfter(8.1),
      alreadyConfirmed: false,
    });
    expect(result).toBe(true);
  });

  it("is niet in aanmerking als de betaling niet 'paid' is", () => {
    const result = isEligibleForManualConfirmation({
      paymentStatus: "open",
      mollieCreatedAt: CREATED,
      molliePaidAt: paidAfter(30),
      alreadyConfirmed: false,
    });
    expect(result).toBe(false);
  });

  it("is niet in aanmerking als paymentStatus ontbreekt", () => {
    const result = isEligibleForManualConfirmation({
      paymentStatus: null,
      mollieCreatedAt: CREATED,
      molliePaidAt: paidAfter(30),
      alreadyConfirmed: false,
    });
    expect(result).toBe(false);
  });

  it("is niet in aanmerking als Timestamp A (mollieCreatedAt) ontbreekt", () => {
    const result = isEligibleForManualConfirmation({
      paymentStatus: "paid",
      mollieCreatedAt: null,
      molliePaidAt: paidAfter(30),
      alreadyConfirmed: false,
    });
    expect(result).toBe(false);
  });

  it("is niet in aanmerking als Timestamp B (molliePaidAt) ontbreekt", () => {
    const result = isEligibleForManualConfirmation({
      paymentStatus: "paid",
      mollieCreatedAt: CREATED,
      molliePaidAt: undefined,
      alreadyConfirmed: false,
    });
    expect(result).toBe(false);
  });

  it("is niet in aanmerking bij een onleesbare/ongeldige timestamp-tekst", () => {
    const result = isEligibleForManualConfirmation({
      paymentStatus: "paid",
      mollieCreatedAt: "niet-een-datum",
      molliePaidAt: paidAfter(30),
      alreadyConfirmed: false,
    });
    expect(result).toBe(false);
  });

  it("is niet in aanmerking als de order al eerder handmatig bevestigd is", () => {
    const result = isEligibleForManualConfirmation({
      paymentStatus: "paid",
      mollieCreatedAt: CREATED,
      molliePaidAt: paidAfter(30),
      alreadyConfirmed: true,
    });
    expect(result).toBe(false);
  });
});

describe("getMollieDelayMs / getMollieDelaySeconds", () => {
  it("berekent het juiste verschil in milliseconden en seconden", () => {
    expect(getMollieDelayMs(CREATED, paidAfter(12))).toBe(12000);
    expect(getMollieDelaySeconds(CREATED, paidAfter(12))).toBe(12);
  });

  it("geeft null als paidAt vóór createdAt ligt (dataprobleem, geen gok)", () => {
    const created = paidAfter(10);
    const paid = CREATED;
    expect(getMollieDelayMs(created, paid)).toBeNull();
  });

  it("geeft null als één van beide timestamps ontbreekt", () => {
    expect(getMollieDelayMs(null, paidAfter(10))).toBeNull();
    expect(getMollieDelayMs(CREATED, null)).toBeNull();
    expect(getMollieDelayMs(null, null)).toBeNull();
  });
});

describe("parseMollieTimestamp", () => {
  it("herkent een geldige ISO-tekst en een Date-object", () => {
    expect(parseMollieTimestamp(CREATED)).toBeInstanceOf(Date);
    expect(parseMollieTimestamp(new Date(CREATED))).toBeInstanceOf(Date);
  });

  it("geeft null voor lege waarden en ongeldige tekst", () => {
    expect(parseMollieTimestamp(null)).toBeNull();
    expect(parseMollieTimestamp(undefined)).toBeNull();
    expect(parseMollieTimestamp("")).toBeNull();
    expect(parseMollieTimestamp("dit-is-geen-datum")).toBeNull();
  });
});
