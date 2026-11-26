// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";
import {
  COMMANDS,
  GREETINGS,
  HIDDEN_COMMANDS,
  SECTIONS,
  commonPrefix,
  completeCommand,
  editDistance,
  findProject,
  normalizeCommand,
  normalizeTyping,
  suggestCommand,
  summarize,
} from "@/lib/terminal";

const projects = [
  { slug: "sample-shop", title: "Sample Shop" },
  { slug: "pharmacy-app-plus", title: "Pharmacy App+" },
  { slug: "support-ticketing", title: "Support Ticketing System" },
];
const commands = [...COMMANDS, ...projects.map((p) => `open ${p.slug}`)];

describe("normalizeCommand", () => {
  it("lower-cases, trims and squeezes spaces", () => {
    expect(normalizeCommand("  LS    Projects  ")).toBe("ls projects");
  });

  it("turns the long dashes phone keyboards make back into --", () => {
    expect(normalizeCommand("git log —stats")).toBe("git log --stats");
    expect(normalizeCommand("git log –stats")).toBe("git log --stats");
  });

  it("keeps a trailing space only while typing (Tab after 'cd ')", () => {
    expect(normalizeTyping("cd ")).toBe("cd ");
    expect(normalizeCommand("cd ")).toBe("cd");
  });
});

describe("editDistance and commonPrefix", () => {
  it("counts single-letter edits", () => {
    expect(editDistance("skils", "skills")).toBe(1);
    expect(editDistance("help", "help")).toBe(0);
    expect(editDistance("", "abc")).toBe(3);
  });

  it("finds the shared start", () => {
    expect(commonPrefix(["cd about", "cd skills"])).toBe("cd ");
    expect(commonPrefix(["clear", "contact"])).toBe("c");
    expect(commonPrefix([])).toBe("");
  });
});

describe("completeCommand (Tab)", () => {
  it("fills in the only match", () => {
    expect(completeCommand("wh", commands)).toEqual({ fill: "whoami" });
    expect(completeCommand("g", commands)).toEqual({ fill: "git log --stats" });
    expect(completeCommand("cl", commands)).toEqual({ fill: "clear" });
  });

  it("fills in what several matches share", () => {
    expect(completeCommand("op", commands)).toEqual({ fill: "open " });
  });

  it("lists the options when there's nothing more to fill", () => {
    expect(completeCommand("c", commands)).toEqual({
      options: ["cd …", "cat …", "contact", "curl resume.pdf", "clear"],
    });
    expect(completeCommand("ls", commands)).toEqual({ options: ["ls", "ls projects"] });
    expect(completeCommand("open ", commands)).toEqual({
      options: projects.map((p) => `open ${p.slug}`),
    });
  });

  it("lists every section after 'cd '", () => {
    const result = completeCommand("cd ", commands);
    expect(result).toEqual({ options: Object.keys(SECTIONS).map((s) => `cd ${s}`) });
  });

  it("returns null when nothing matches, so Tab moves focus as usual", () => {
    expect(completeCommand("", commands)).toBeNull();
    expect(completeCommand("   ", commands)).toBeNull();
    expect(completeCommand("what is this", commands)).toBeNull();
  });

  it("never completes a hidden command", () => {
    expect(completeCommand("ha", commands)).toBeNull(); // hack mainframe
    expect(completeCommand("cof", commands)).toBeNull(); // coffee
  });
});

describe("summarize", () => {
  it("groups commands that share a first word until that word is typed", () => {
    expect(summarize(["cd about", "cd skills", "clear"], "c")).toEqual(["cd …", "clear"]);
    expect(summarize(["cd about", "cd skills"], "cd ")).toEqual(["cd about", "cd skills"]);
  });
});

describe("suggestCommand (did you mean)", () => {
  it("catches typos", () => {
    expect(suggestCommand("skils", commands)).toBe("skills");
    expect(suggestCommand("cd abuot", commands)).toBe("cd about");
    expect(suggestCommand("lang fr", commands)).toBe("lang ar");
  });

  it("maps a command word to its closest command", () => {
    expect(suggestCommand("git status", commands)).toBe("git log --stats");
    expect(suggestCommand("sudo make coffee", commands)).toBe("sudo hire-me");
    expect(suggestCommand("cat resume", commands)).toBe("cat certs");
  });

  it("leaves questions for the AI guide", () => {
    expect(suggestCommand("what is sample shop", commands)).toBeNull();
    expect(suggestCommand("open to relocation?", commands)).toBeNull();
    expect(suggestCommand("tell me about your experience", commands)).toBeNull();
  });
});

describe("findProject (open <name>)", () => {
  it("matches the exact slug first", () => {
    expect(findProject("sample-shop", projects)?.title).toBe("Sample Shop");
  });

  it("matches part of a slug or title when only one project fits", () => {
    expect(findProject("pharmacy", projects)?.slug).toBe("pharmacy-app-plus");
    expect(findProject("ticketing", projects)?.slug).toBe("support-ticketing");
  });

  it("gives nothing when no project or several fit", () => {
    expect(findProject("xyz", projects)).toBeNull();
    expect(findProject("e", projects)).toBeNull();
  });
});

describe("command lists", () => {
  it("has no duplicates", () => {
    expect(new Set(COMMANDS).size).toBe(COMMANDS.length);
  });

  it("keeps the easter eggs out of the listed commands", () => {
    for (const hidden of HIDDEN_COMMANDS) expect(COMMANDS).not.toContain(hidden);
  });

  it("has a cd command for every section", () => {
    for (const section of Object.keys(SECTIONS)) expect(COMMANDS).toContain(`cd ${section}`);
  });

  it("stores greetings normalized, as typed input is compared after normalizing", () => {
    for (const greeting of GREETINGS) expect(normalizeCommand(greeting)).toBe(greeting);
  });

  it.each([
    ["en", en.terminal.help],
    ["ar", ar.terminal.help],
  ])("mentions every command's first word in the %s help text", (_locale, help) => {
    // `contact` still works (older habit), but help shows `cd contact` instead.
    const notInHelp = new Set(["contact"]);
    for (const command of COMMANDS.filter((c) => !notInHelp.has(c)))
      expect(help, command).toContain(command.split(" ")[0]);
  });
});
