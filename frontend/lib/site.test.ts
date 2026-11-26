// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import { describe, expect, it } from "vitest";
import {
  certsText,
  clip,
  educationText,
  experienceText,
  personJsonLd,
  projectPath,
  projectSubtitle,
  projectsListText,
  shortBio,
  skillsText,
  starterQuestions,
  whoamiText,
  yearOf,
} from "@/lib/site";
import {
  emptySiteSettings,
  type Certification,
  type Education,
  type Experience,
  type Guide,
  type Project,
  type SiteSettings,
  type Skill,
  type SkillCategory,
} from "@/lib/types";

const settings = (patch: Partial<SiteSettings>): SiteSettings => ({
  ...emptySiteSettings,
  ...patch,
});
// Test records only need the fields the function reads.
const as = <T>(value: Partial<T>) => value as T;

describe("yearOf (dates are free text in the database)", () => {
  it.each([
    ["Jun 2026", "2026"],
    ["September 2023", "2023"],
    ["2026-06", "2026"],
    ["06/2026", "2026"],
    ["يونيو 2026", "2026"],
  ])("reads %s as %s", (value, year) => {
    expect(yearOf(value)).toBe(year);
  });

  it("gives null when there's no year", () => {
    expect(yearOf("Present")).toBeNull();
    expect(yearOf(null)).toBeNull();
    expect(yearOf(undefined)).toBeNull();
  });
});

describe("shortBio (meta and link-preview description)", () => {
  it("takes the first sentence", () => {
    expect(shortBio(settings({ bio: "First sentence. Second one." }))).toBe("First sentence.");
  });

  it("cuts a long sentence to fit, with an ellipsis", () => {
    const result = shortBio(settings({ bio: `${"word ".repeat(60)}end.` }));
    expect(result.length).toBeLessThanOrEqual(160);
    expect(result.endsWith("…")).toBe(true);
  });

  it("falls back to the headline, then a generic title", () => {
    expect(shortBio(settings({ bio: "  ", headline: "Engineer" }))).toBe("Engineer");
    expect(shortBio(settings({}))).toBe("Portfolio");
  });
});

describe("terminal texts", () => {
  it("whoami joins name, headline, bio and availability", () => {
    const text = whoamiText(
      settings({
        fullName: "Test Person",
        headline: "Engineer",
        bio: "Hello there.",
        location: "Testland",
        availability: "Open",
      }),
      "loading"
    );
    expect(text).toBe("Test Person — Engineer\nHello there.\nTestland · Open");
    expect(whoamiText(settings({}), "loading")).toBe("loading");
  });

  it("skills shows the first few per category and how many more", () => {
    const categories = [
      as<SkillCategory>({
        name: "Backend",
        skills: ["A", "B", "C"].map((name) => as<Skill>({ name })),
      }),
      as<SkillCategory>({ name: "Empty", skills: [] }),
    ];
    const labels = { more: (n: number) => `+${n} more`, hint: "hint", empty: "none" };
    expect(skillsText(categories, labels, 2)).toBe("Backend: A, B, +1 more\n\nhint");
    expect(skillsText([], labels)).toBe("none");
  });

  it("ls projects lists title, year and summary", () => {
    const list = [
      as<Project>({ title: "Shop", year: "2025", summary: "Sells things." }),
      as<Project>({ title: "Tool", year: null, summary: "" }),
    ];
    expect(projectsListText(list, { hint: "hint", empty: "none" })).toBe(
      "Shop (2025) - Sells things.\nTool\n\nhint"
    );
    expect(projectsListText([], { hint: "hint", empty: "none" })).toBe("none");
  });

  it("cat certs reads the year from a free-text date", () => {
    const certs = [
      as<Certification>({ name: "Cert A", issuer: "Board", issueDate: "Mar 2025" }),
      as<Certification>({ name: "Cert B", issuer: "", issueDate: "Pending" }),
    ];
    expect(certsText(certs, { empty: "none" })).toBe("Cert A - Board (2025)\nCert B");
  });

  it("cat experience shows a year range, with 'Present' as now", () => {
    const jobs = [
      as<Experience>({
        role: "Engineer",
        company: "Co",
        startDate: "Jun 2024",
        endDate: "Present",
      }),
      as<Experience>({
        role: "Intern",
        company: "Org",
        startDate: "Jan 2023",
        endDate: "Mar 2023",
      }),
      as<Experience>({ role: "Dev", company: "X", startDate: "2021", endDate: null }),
    ];
    expect(experienceText(jobs, { present: "present", empty: "none" })).toBe(
      "2024 – present  Engineer @ Co\n2023  Intern @ Org\n2021 – present  Dev @ X"
    );
  });

  it("cat education lists awards under the degree", () => {
    const degrees = [
      as<Education>({
        degree: "BSc",
        institution: "Uni",
        startDate: "September 2020",
        endDate: "Jun 2024",
        awards: ["Award"],
      }),
    ];
    expect(educationText(degrees, { present: "present", empty: "none" })).toBe(
      "2020 – 2024  BSc - Uni\n  ★ Award"
    );
    expect(educationText([], { present: "present", empty: "none" })).toBe("none");
  });
});

describe("starterQuestions (chat chips)", () => {
  it("takes the first short guide titles in order", () => {
    const guides = ["One?", "  ", "x".repeat(61), "Two?", "Three?", "Four?", "Five?"].map((title) =>
      as<Guide>({ title })
    );
    expect(starterQuestions(guides)).toEqual(["One?", "Two?", "Three?", "Four?"]);
  });
});

describe("personJsonLd (structured data)", () => {
  it("escapes < so the text can't close the script tag", () => {
    const json = personJsonLd(settings({ fullName: "</script><b>x" }));
    expect(json).not.toContain("<");
    expect(JSON.parse(json).name).toBe("</script><b>x");
  });

  it("links the Arabic page for Arabic", () => {
    const data = JSON.parse(personJsonLd(settings({ fullName: "A" }), "ar"));
    expect(data.url).toMatch(/\/ar$/);
  });
});

describe("project page helpers", () => {
  it("builds the page address in each language", () => {
    expect(projectPath("en", "rentops")).toBe("/projects/rentops");
    expect(projectPath("ar", "rentops")).toBe("/ar/projects/rentops");
  });

  it("adds the year to the subtitle only when the context doesn't already say it", () => {
    expect(projectSubtitle(as<Project>({ context: "Senior Project", year: "2025" }))).toBe(
      "Senior Project · 2025"
    );
    expect(projectSubtitle(as<Project>({ context: "Team project · 2024", year: "2024" }))).toBe(
      "Team project · 2024"
    );
    expect(projectSubtitle(as<Project>({ context: null, year: null }))).toBeUndefined();
  });

  it("clips long text between words", () => {
    expect(clip("  short   text ")).toBe("short text");
    const clipped = clip("word ".repeat(50), 30);
    expect(clipped.length).toBeLessThanOrEqual(30);
    expect(clipped).toMatch(/word…$/);
  });
});
