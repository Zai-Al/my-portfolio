// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useState, useRef, useEffect } from "react";
import { MAX_QUESTION_LENGTH } from "@/lib/api/ask";
import { openAiGuide } from "@/lib/aiGuide";

type Line = { type: "input" | "output" | "ai" | "hack"; text: string };

const HELP_TEXT = `Available commands:
  whoami          - who I am
  skills          - what I work with
  projects        - jump to projects
  contact         - how to reach me
  curl resume.pdf - download my resume
  git log --stats - pull live GitHub stats
  clear           - clear the terminal
  help            - show this message

Not a command? Just type a question - the AI guide
(bottom-right) opens and answers it.`;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, prefersReducedMotion() ? 0 : ms));
}

function progressBar(pct: number): string {
  const filled = Math.round(pct / 10);
  return `[${"█".repeat(filled)}${"-".repeat(10 - filled)}] ${pct}%`;
}

function downloadResume(cvUrl: string | null): string {
  if (!cvUrl) return "No CV has been uploaded yet.";
  const a = document.createElement("a");
  a.href = cvUrl;
  a.download = ""; // same-origin files download; cross-origin ones open in a new tab
  a.target = "_blank";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  return "Downloading my CV...";
}

// "https://github.com/Zai-Al" -> "Zai-Al"
function githubHandle(githubUrl: string | null): string | null {
  if (!githubUrl) return null;
  try {
    return new URL(githubUrl).pathname.split("/").filter(Boolean)[0] ?? null;
  } catch {
    return null;
  }
}

async function fetchGithubStats(handle: string | null): Promise<string> {
  if (!handle) return "No GitHub profile is set yet.";
  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(handle)}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    return [
      `GitHub: @${data.login}`,
      `  public repos : ${data.public_repos}`,
      `  followers    : ${data.followers}`,
      `  following    : ${data.following}`,
      `  joined       : ${new Date(data.created_at).toISOString().slice(0, 10)}`,
    ].join("\n");
  } catch {
    return "Couldn't reach the GitHub API right now.";
  }
}

// Every listed command, for "did you mean" (the hidden easter egg is left out on purpose).
const COMMANDS = [
  "help",
  "whoami",
  "skills",
  "projects",
  "contact",
  "curl resume.pdf",
  "git log --stats",
  "clear",
];
// First words that only ever start a command, never a question.
const COMMAND_HEADS = new Set(["git", "curl"]);

/**
 * Lower-case, single spaces, and the long dashes phone keyboards make out of "--"
 * ("git log —stats") turned back into "--".
 */
function normalizeCommand(raw: string): string {
  return raw
    .trim()
    .replace(/[\u2013\u2014]/g, "--")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

// Levenshtein distance: how many single-letter edits turn a into b.
function editDistance(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++)
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = row;
  }
  return prev[b.length];
}

/**
 * The command a near miss was meant to be, or null when it reads like a question for the AI.
 * "git status" / "git log --status" (phone autocorrect) → "git log --stats"; "skils" → "skills".
 */
function suggestCommand(cmd: string): string | null {
  const head = cmd.split(" ")[0];
  const candidates = COMMAND_HEADS.has(head)
    ? COMMANDS.filter((c) => c.startsWith(head))
    : COMMANDS;
  let best: string | null = null;
  let bestDistance = Infinity;
  for (const c of candidates) {
    const d = editDistance(cmd, c);
    if (d < bestDistance) [best, bestDistance] = [c, d];
  }
  if (COMMAND_HEADS.has(head)) return best;
  return best && bestDistance <= Math.max(1, Math.floor(best.length / 4)) ? best : null;
}

// Recognized navigation commands. Anything not matched here falls through to the AI.
// Returns null for "not handled", or a string/Promise<string> of output.
function runCommand(
  cmd: string,
  links: { cvUrl: string | null; githubUrl: string | null; whoami: string; skills: string }
): string | Promise<string> | null {
  switch (normalizeCommand(cmd)) {
    case "help":
      return HELP_TEXT;
    case "whoami":
      return links.whoami;
    case "skills":
      return links.skills;
    case "projects":
      document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" });
      return "Scrolling to projects...";
    case "contact":
      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
      return "Scrolling to contact...";
    case "curl resume.pdf":
      return downloadResume(links.cvUrl);
    case "git log --stats":
    case "git log --stat":
      return fetchGithubStats(githubHandle(links.githubUrl));
    default:
      return null;
  }
}

type TerminalProps = {
  cvUrl: string | null;
  githubUrl: string | null;
  /** Answers for `whoami` and `skills`, built from the database (lib/site.ts). */
  whoami: string;
  skills: string;
  /** Width classes for the window (default: up to max-w-2xl). */
  className?: string;
};

export default function Terminal({
  cvUrl,
  githubUrl,
  whoami,
  skills,
  className = "w-full max-w-2xl",
}: TerminalProps) {
  const [lines, setLines] = useState<Line[]>([
    { type: "output", text: "Welcome. Type 'help' for commands, or just ask me a question." },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  function appendLine(line: Line) {
    setLines((prev) => [...prev, line]);
  }

  async function runHackSequence() {
    const steps: Array<{ text: string; delay: number }> = [
      { text: "Connecting to mainframe...", delay: 500 },
      { text: `Bypassing firewall... ${progressBar(30)}`, delay: 500 },
      { text: `Bypassing firewall... ${progressBar(70)}`, delay: 500 },
      { text: `Bypassing firewall... ${progressBar(100)}`, delay: 400 },
      { text: `Decrypting payload... ${progressBar(45)}`, delay: 500 },
      { text: `Decrypting payload... ${progressBar(90)}`, delay: 500 },
      { text: `Decrypting payload... ${progressBar(100)}`, delay: 400 },
      { text: "ACCESS GRANTED", delay: 500 },
      {
        text: "Hidden file recovered: this whole site is client-rendered React + an ASP.NET Core API — nothing here was actually hacked, but nice try. Have a cookie: 🍪",
        delay: 0,
      },
    ];

    for (const step of steps) {
      await wait(step.delay);
      appendLine({ type: "hack", text: step.text });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd) return;

    appendLine({ type: "input", text: cmd });
    setInput("");

    const normalized = normalizeCommand(cmd);
    if (normalized === "clear") {
      setLines([]);
      return;
    }

    // Hidden easter egg - intentionally not listed in `help`.
    if (normalized === "hack mainframe") {
      await runHackSequence();
      return;
    }

    const builtIn = runCommand(cmd, { cvUrl, githubUrl, whoami, skills });
    if (builtIn !== null) {
      const text = typeof builtIn === "string" ? builtIn : await builtIn;
      appendLine({ type: "output", text });
      return;
    }

    // A near miss stays in the terminal, with the right command typed in ready to run.
    const suggestion = suggestCommand(normalized);
    if (suggestion) {
      appendLine({
        type: "output",
        text: `command not found: ${cmd}\nDid you mean '${suggestion}'? Press Enter to run it.`,
      });
      setInput(suggestion);
      return;
    }

    // Anything else is a question: hand it to the AI guide panel, so there's one AI and
    // one conversation (follow-ups and source links work there).
    openAiGuide(cmd);
    appendLine({ type: "ai", text: "→ asking the AI guide… (it opened bottom-right ↘)" });
  }

  return (
    <div
      className={`${className} rounded-lg border border-border bg-panel/80 shadow-lg backdrop-blur-sm transition-colors focus-within:border-accent/60`}
    >
      <div className="flex items-center gap-1.5 border-b border-border px-4 py-2">
        <span className="h-3 w-3 rounded-full bg-red-500/70" />
        <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
        <span className="h-3 w-3 rounded-full bg-green-500/70" />
        <span className="ml-3 font-mono text-xs text-gray-400">guest@portfolio:~</span>
      </div>

      <div ref={scrollRef} className="h-72 overflow-y-auto px-4 py-3 font-mono text-sm">
        {lines.map((line, i) => (
          <div
            key={i}
            className={
              line.type === "input"
                ? "text-accent"
                : line.type === "ai"
                  ? "text-aurora-purple whitespace-pre-wrap"
                  : line.type === "hack"
                    ? "text-aurora-teal whitespace-pre-wrap"
                    : "text-gray-300 whitespace-pre-wrap"
            }
          >
            {line.type === "input" ? `> ${line.text}` : line.text}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex border-t border-border px-4 py-2">
        <span className="mr-2 font-mono text-accent">{">"}</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-transparent font-mono text-sm text-white outline-none"
          aria-label="Terminal: type a command or ask a question"
          placeholder="type a command or ask anything..."
          maxLength={MAX_QUESTION_LENGTH}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="send"
        />
      </form>
    </div>
  );
}
