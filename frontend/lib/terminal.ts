// Copyright (c) 2026 Zainab Alawi. All rights reserved.

// The home page terminal's command list and matching: what counts as a command, Tab
// completion and "did you mean". Plain functions (no React, no DOM), so they're unit tested
// in terminal.test.ts; components/sections/Terminal.tsx runs the commands.

// Sections `cd` can go to, and the element id each one scrolls to.
export const SECTIONS: Record<string, string> = {
  about: "about",
  education: "education",
  experience: "experience",
  skills: "skills",
  projects: "projects",
  certs: "certifications",
  contact: "contact",
};
export const HOME_TARGETS = new Set(["", "~", "..", "/", "home"]);

// Every listed command, for Tab and "did you mean" (`open <slug>` is added per project).
// The easter eggs below are left out on purpose.
export const COMMANDS = [
  "help",
  "ls",
  "ls projects",
  ...Object.keys(SECTIONS).map((s) => `cd ${s}`),
  "cat certs",
  "cat education",
  "cat experience",
  "whoami",
  "skills",
  "projects",
  "contact",
  "curl resume.pdf",
  "git log --stats",
  "history",
  "lang ar",
  "lang en",
  "playground",
  "sudo hire-me",
  "clear",
];
// First words that only ever start a command, never a question. ("open" isn't one:
// "open to relocation?" is a question.)
export const COMMAND_HEADS = new Set(["git", "curl", "ls", "cat", "sudo", "cd", "lang"]);

// Easter eggs: they run when typed exactly, but never show up in help, Tab or "did you mean".
// Listed here only so `secret` can count them.
export const HIDDEN_COMMANDS = [
  "hack mainframe",
  "npm install job",
  "coffee",
  "vim",
  "exit",
  "sudo rm -rf /",
  "party",
];
export const GREETINGS = new Set([
  "hi",
  "hello",
  "hey",
  "مرحبا",
  "مرحبًا",
  "اهلا",
  "أهلا",
  "السلام عليكم",
]);

/**
 * Lower-case, single spaces, and the long dashes phone keyboards make out of "--"
 * ("git log —stats") turned back into "--".
 */
export function normalizeCommand(raw: string): string {
  return normalizeTyping(raw).trim();
}

/** Like normalizeCommand, but keeps a trailing space ("cd " + Tab asks for the sections). */
export function normalizeTyping(raw: string): string {
  return raw.trimStart().replace(/[–—]/g, "--").replace(/\s+/g, " ").toLowerCase();
}

// Levenshtein distance: how many single-letter edits turn a into b.
export function editDistance(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++)
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = row;
  }
  return prev[b.length];
}

/** The longest start that every string in the list shares. */
export function commonPrefix(words: string[]): string {
  let prefix = words[0] ?? "";
  for (const w of words) while (!w.startsWith(prefix)) prefix = prefix.slice(0, -1);
  return prefix;
}

/**
 * Matches, shortened for listing: after "c", the seven `cd` commands read as one "cd …".
 * Once the first word is typed ("cd ", "ls"), each is shown in full.
 */
export function summarize(options: string[], typed: string): string[] {
  const head = (o: string) => o.split(" ")[0];
  const count = new Map<string, number>();
  for (const o of options) count.set(head(o), (count.get(head(o)) ?? 0) + 1);
  return [
    ...new Set(
      options.map((o) =>
        count.get(head(o))! > 1 && typed.trim().length < head(o).length ? `${head(o)} …` : o
      )
    ),
  ];
}

/**
 * Tab completion, like a shell: one match is filled in; several fill in what they share,
 * and a Tab that adds nothing lists them. Null when nothing matches (Tab then moves focus).
 */
export function completeCommand(
  raw: string,
  commands: string[]
): { fill: string } | { options: string[] } | null {
  const typed = normalizeTyping(raw);
  if (!typed.trim()) return null;
  const matches = commands.filter((c) => c.startsWith(typed));
  if (matches.length === 0) return null;
  const prefix = commonPrefix(matches);
  if (matches.length === 1) return { fill: prefix };
  return prefix.length > typed.length ? { fill: prefix } : { options: summarize(matches, typed) };
}

/**
 * The command a near miss was meant to be, or null when it reads like a question for the AI.
 * "git status" / "git log --status" (phone autocorrect) → "git log --stats"; "skils" → "skills".
 */
export function suggestCommand(cmd: string, commands: string[]): string | null {
  const head = cmd.split(" ")[0];
  const candidates = COMMAND_HEADS.has(head)
    ? commands.filter((c) => c.startsWith(`${head} `) || c === head)
    : commands;
  let best: string | null = null;
  let bestDistance = Infinity;
  for (const c of candidates) {
    const d = editDistance(cmd, c);
    if (d < bestDistance) [best, bestDistance] = [c, d];
  }
  if (COMMAND_HEADS.has(head)) return best;
  return best && bestDistance <= Math.max(1, Math.floor(best.length / 4)) ? best : null;
}

export type ProjectLink = { slug: string; title: string };

/** `open <name>`: the exact slug, or the one project whose slug or title contains the name. */
export function findProject(name: string, projects: ProjectLink[]): ProjectLink | null {
  const exact = projects.find((p) => p.slug === name);
  if (exact) return exact;
  const found = projects.filter(
    (p) => p.slug.includes(name) || p.title.toLowerCase().includes(name)
  );
  return found.length === 1 ? found[0] : null;
}
