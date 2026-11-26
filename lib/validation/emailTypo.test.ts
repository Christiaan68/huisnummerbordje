import { describe, expect, it } from "vitest";
import { suggestEmailCorrection } from "@/lib/validation/emailTypo";

describe("typfout-controle e-mailadres", () => {
  it("herkent veelgemaakte fouten", () => {
    expect(suggestEmailCorrection("ihctenhaaken@gmail.vom")).toBe("ihctenhaaken@gmail.com");
    expect(suggestEmailCorrection("jan@gmial.com")).toBe("jan@gmail.com");
    expect(suggestEmailCorrection("jan@hotmial.nl")).toBe("jan@hotmail.nl");
    expect(suggestEmailCorrection("Jan.Jansen@outlook.con")).toBe("Jan.Jansen@outlook.com");
    expect(suggestEmailCorrection("info@mijnbedrijf.vom")).toBe("info@mijnbedrijf.com");
    expect(suggestEmailCorrection("info@mijnbedrijf.nll")).toBe("info@mijnbedrijf.nl");
  });
  it("laat goede of onbekende adressen met rust", () => {
    expect(suggestEmailCorrection("jan@gmail.com")).toBeNull();
    expect(suggestEmailCorrection("christiaan@tenhaaken.nl")).toBeNull();
    expect(suggestEmailCorrection("info@langcat.nl")).toBeNull();
    expect(suggestEmailCorrection("test.emaillehuisnummerbord@tenhaaken.nl")).toBeNull();
    expect(suggestEmailCorrection("onvolledig@")).toBeNull();
  });
});
