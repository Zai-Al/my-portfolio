// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";
import { arabicDate, localize } from "@/lib/i18n/localize";

describe("arabicDate", () => {
  it.each([
    ["Jun 2026", "يونيو 2026"],
    ["June 2026", "يونيو 2026"],
    ["Sept. 2023", "سبتمبر 2023"],
    ["2026-06", "يونيو 2026"],
    ["06/2026", "يونيو 2026"],
    ["1/2025", "يناير 2025"],
  ])("turns %s into %s", (value, expected) => {
    expect(arabicDate(value)).toBe(expected);
  });

  it.each(["2026", "Present", "يونيو 2026", "Foo 2026", "2026-13"])(
    "leaves %s unchanged",
    (value) => {
      expect(arabicDate(value)).toBe(value);
    }
  );
});

describe("localize", () => {
  const record = {
    role: "Engineer",
    roleAr: "مهندس",
    company: "Co",
    companyAr: "",
    bullets: ["Did a thing"],
    bulletsAr: [],
    startDate: "Jun 2024",
  };

  it("leaves English untouched", () => {
    expect(localize(record, "en")).toBe(record);
  });

  it("uses filled-in Arabic fields and keeps English where Arabic is empty", () => {
    const out = localize(record, "ar");
    expect(out.role).toBe("مهندس");
    expect(out.company).toBe("Co");
    expect(out.bullets).toEqual(["Did a thing"]);
  });

  it("turns month names in dates into Arabic", () => {
    expect(localize(record, "ar").startDate).toBe("يونيو 2024");
  });

  it("works through lists and nested records (categories with skills)", () => {
    const categories = [
      { name: "Backend", nameAr: "الخلفية", skills: [{ name: "C#", nameAr: null }] },
    ];
    const [out] = localize(categories, "ar");
    expect(out.name).toBe("الخلفية");
    expect(out.skills[0].name).toBe("C#");
  });

  it("passes null and plain values through", () => {
    expect(localize(null, "ar")).toBeNull();
    expect(localize("text", "ar")).toBe("text");
  });
});

// The UI strings in messages/*.json.
type Messages = { [key: string]: string | Messages };
const flatten = (messages: Messages, prefix = ""): Record<string, string> =>
  Object.entries(messages).reduce<Record<string, string>>((all, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string"
      ? { ...all, [path]: value }
      : { ...all, ...flatten(value, path) };
  }, {});
const enStrings = flatten(en as Messages);
const arStrings = flatten(ar as Messages);

describe("UI strings (messages/*.json)", () => {
  it("has every English string in Arabic too, and nothing extra", () => {
    expect(Object.keys(arStrings).sort()).toEqual(Object.keys(enStrings).sort());
  });

  it("uses the same {placeholders} in both languages", () => {
    const placeholders = (text: string) => [...text.matchAll(/\{(\w+)/g)].map((m) => m[1]).sort();
    for (const [key, text] of Object.entries(enStrings))
      expect(placeholders(arStrings[key] ?? ""), key).toEqual(placeholders(text));
  });

  it("never puts a single quote right before a placeholder (ICU would hide the value)", () => {
    // In ICU messages '{x}' is literal text "{x}"; write ''{x}'' to show quotes around a value.
    // Each language on its own: the keys are the same, so merging them would hide one.
    const broken = Object.entries({ en: enStrings, ar: arStrings }).flatMap(([locale, strings]) =>
      Object.entries(strings)
        .filter(([, text]) => /(^|[^'])'\{/.test(text))
        .map(([key]) => `${locale}: ${key}`)
    );
    expect(broken).toEqual([]);
  });
});
