import { describe, expect, it } from "vitest";
import { suggestEmailCorrection } from "@/lib/validation/emailTypo";

describe("typfout-controle e-mailadres", () => {
  it("herkent veelgemaakte fouten", () => {
    expect(suggestEmailCorrection("ihctenhaaken@gmail.vom")).toBe("ihctenhaaken@gmail.com");
    expect(suggestEmailCorrection("jan@gmial.com")).toBe("jan@gmail.com");
    expect(suggestEmailCorrection("jan@gmaim.nl")).toBe("jan@gmail.com");
    expect(suggestEmailCorrection("jan@gmail.nl")).toBe("jan@gmail.com");
    expect(suggestEmailCorrection("jan@gmai.com")).toBe("jan@gmail.com");
    expect(suggestEmailCorrection("jan@hotmial.nl")).toBe("jan@hotmail.nl");
    expect(suggestEmailCorrection("jan@hotmail.vom")).toBe("jan@hotmail.com");
    expect(suggestEmailCorrection("Jan.Jansen@outlook.con")).toBe("Jan.Jansen@outlook.com");
    expect(suggestEmailCorrection("jan@outlok.nl")).toBe("jan@outlook.nl");
    expect(suggestEmailCorrection("jan@zigo.nl")).toBe("jan@ziggo.nl");
    expect(suggestEmailCorrection("jan@icloud.nl")).toBe("jan@icloud.com");
    expect(suggestEmailCorrection("info@mijnbedrijf.vom")).toBe("info@mijnbedrijf.com");
    expect(suggestEmailCorrection("info@mijnbedrijf.nll")).toBe("info@mijnbedrijf.nl");
  });
  it("laat goede of onbekende adressen met rust", () => {
    expect(suggestEmailCorrection("jan@gmail.com")).toBeNull();
    expect(suggestEmailCorrection("jan@hotmail.de")).toBeNull();
    expect(suggestEmailCorrection("jan@gmx.de")).toBeNull();
    expect(suggestEmailCorrection("jan@web.de")).toBeNull();
    expect(suggestEmailCorrection("jan@t-online.de")).toBeNull();
    expect(suggestEmailCorrection("jan@hema.nl")).toBeNull();
    expect(suggestEmailCorrection("jan@life.nl")).toBeNull();
    expect(suggestEmailCorrection("christiaan@tenhaaken.nl")).toBeNull();
    expect(suggestEmailCorrection("info@langcat.nl")).toBeNull();
    expect(suggestEmailCorrection("test.emaillehuisnummerbord@tenhaaken.nl")).toBeNull();
    expect(suggestEmailCorrection("onvolledig@")).toBeNull();
  });
});
