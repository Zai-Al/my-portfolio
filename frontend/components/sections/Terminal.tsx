// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { localePath } from "@/i18n/routing";
import { MAX_QUESTION_LENGTH } from "@/lib/api/ask";
import { openAiGuide } from "@/lib/aiGuide";
import TerminalLife, { LIFE_MS } from "@/components/sections/TerminalLife";
import {
  COMMANDS,
  GREETINGS,
  HIDDEN_COMMANDS,
  HOME_TARGETS,
  SECTIONS,
  commonPrefix,
  completeCommand,
  findProject,
  normalizeCommand,
  suggestCommand,
  summarize,
  type ProjectLink,
} from "@/lib/terminal";

// "life" is the Game of Life burst (TerminalLife); its text is unused.
type Line = { type: "input" | "output" | "ai" | "hack" | "life"; text: string };

/** The terminal's sentences, in the page's language ("terminal" strings in messages/*.json). */
type TerminalText = (key: string, values?: Record<string, string>) => string;

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

function downloadResume(cvUrl: string | null, t: TerminalText): string {
  if (!cvUrl) return t("noCv");
  const a = document.createElement("a");
  a.href = cvUrl;
  a.download = ""; // same-origin files download; cross-origin ones open in a new tab
  a.target = "_blank";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  return t("downloading");
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

async function fetchGithubStats(handle: string | null, t: TerminalText): Promise<string> {
  if (!handle) return t("noGithub");
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
    return t("githubError");
  }
}

function scrollToSection(id: string) {
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
}

type Step = { text: string; delay: number };

const HACK_STEPS: Step[] = [
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

const NPM_STEPS: Step[] = [
  { text: "npm WARN deprecated unemployment@0.0.1: no longer maintained", delay: 400 },
  { text: `fetching full-time-offer... ${progressBar(40)}`, delay: 500 },
  { text: `fetching full-time-offer... ${progressBar(80)}`, delay: 500 },
  { text: `fetching full-time-offer... ${progressBar(100)}`, delay: 400 },
  { text: "added 1 package: full-time-offer@1.0.0", delay: 400 },
  { text: "found 0 vulnerabilities. Run 'sudo hire-me' to finish the install.", delay: 0 },
];

const HISTORY_LIMIT = 50;

/** What the terminal is told by the page (texts built from the database in lib/site.ts). */
type TerminalData = {
  cvUrl: string | null;
  githubUrl: string | null;
  whoami: string;
  skills: string;
  projectsList: string;
  certs: string;
  experience: string;
  education: string;
  projects: ProjectLink[];
};

type CommandContext = TerminalData & {
  locale: string;
  history: string[];
  go: (path: string) => void;
};

// Recognized commands. Anything not matched here falls through to "did you mean" or the AI.
// Takes a normalized command; returns null for "not handled", or the output.
function runCommand(
  cmd: string,
  ctx: CommandContext,
  t: TerminalText
): string | Promise<string> | null {
  if (cmd === "cd" || cmd.startsWith("cd ")) {
    const target = cmd.slice(3).trim();
    if (HOME_TARGETS.has(target)) {
      scrollToSection("home");
      return t("cdHome");
    }
    if (Object.hasOwn(SECTIONS, target)) {
      scrollToSection(SECTIONS[target]);
      return t("cdSection", { section: target });
    }
    return null; // "cd abuot" → "did you mean 'cd about'"
  }

  const open = cmd.match(/^open ([^\s?]+)$/);
  if (open) {
    const project = findProject(open[1], ctx.projects);
    if (!project) return t("openUnknown", { name: open[1] });
    // ProjectsSection opens "#project-<slug>"; nudge it if that hash is already set.
    const hash = `#project-${encodeURIComponent(project.slug)}`;
    if (window.location.hash === hash) window.dispatchEvent(new HashChangeEvent("hashchange"));
    else window.location.hash = hash;
    return t("opening", { title: project.title });
  }

  const lang = cmd.match(/^lang (en|ar)$/);
  if (lang) {
    if (lang[1] === ctx.locale) return t("langSame");
    ctx.go(localePath(lang[1], "/"));
    return t("langSwitching");
  }

  if (GREETINGS.has(cmd)) return t("greeting");

  switch (cmd) {
    case "help":
      return t("help");
    case "ls":
      return t("ls");
    case "ls projects":
      return ctx.projectsList;
    case "cat certs":
      return ctx.certs;
    case "cat education":
      return ctx.education;
    case "cat experience":
      return ctx.experience;
    case "whoami":
      return ctx.whoami;
    case "skills":
      return ctx.skills;
    case "projects":
      scrollToSection("projects");
      return t("scrollingProjects");
    case "contact":
      scrollToSection("contact");
      return t("scrollingContact");
    case "curl resume.pdf":
      return downloadResume(ctx.cvUrl, t);
    case "git log --stats":
    case "git log --stat":
      return fetchGithubStats(githubHandle(ctx.githubUrl), t);
    case "history":
      return ctx.history.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`).join("\n");
    case "playground":
      ctx.go(localePath(ctx.locale, "/playground"));
      return t("toPlayground");

    // Easter eggs (not in help).
    case "coffee":
    case "brew coffee":
      return t("coffee");
    case "vim":
      return t("vim");
    case ":q":
    case ":q!":
    case ":wq":
    case ":x":
      return t("vimQuit");
    case "exit":
      return t("exit");
    case "sudo rm -rf /":
    case "sudo rm -rf /*":
    case "rm -rf /":
      return t("rmrf");
    case "secret":
      return t("secret", { count: String(HIDDEN_COMMANDS.length) });
    default:
      return null;
  }
}

type TerminalProps = TerminalData & {
  /** Width classes for the window (default: up to max-w-2xl). */
  className?: string;
};

export default function Terminal({ className = "w-full max-w-2xl", ...data }: TerminalProps) {
  const t = useTranslations("terminal");
  const locale = useLocale();
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>(() => [{ type: "output", text: t("welcome") }]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Up/down arrow history: what was run (oldest first), where the arrows are in it
  // (history.length = the line being typed), and that half-typed line, kept for the way back.
  const history = useRef<string[]>([]);
  const historyPos = useRef(0);
  const draft = useRef("");
  // The listed commands plus `open <slug>` for each project, for Tab and "did you mean".
  const commands = [...COMMANDS, ...data.projects.map((p) => `open ${p.slug}`)];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  function appendLine(line: Line) {
    setLines((prev) => [...prev, line]);
  }

  async function runSequence(steps: Step[]) {
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
    if (history.current.at(-1) !== cmd)
      history.current = [...history.current, cmd].slice(-HISTORY_LIMIT);
    historyPos.current = history.current.length;
    draft.current = "";

    const normalized = normalizeCommand(cmd);
    if (normalized === "clear") {
      setLines([]);
      return;
    }

    // Easter eggs that print line by line - intentionally not listed in `help`.
    if (normalized === "hack mainframe") return runSequence(HACK_STEPS);
    if (normalized === "npm install job" || normalized === "npm i job")
      return runSequence(NPM_STEPS);

    // The start of a command ("c", "cl", "cd ab"). With its argument begun and only one
    // way to finish it ("cd ab", "open rent"), it just runs.
    const started = commands.filter((c) => c.startsWith(normalized));
    const resolved =
      !commands.includes(normalized) && started.length === 1 && normalized.includes(" ")
        ? started[0]
        : normalized;

    // Celebrations: a Game of Life burst in aurora colours. `sudo hire-me` "approves" the
    // request, lets the burst play, then heads to the contact section.
    if (resolved === "sudo hire-me" || resolved === "party") {
      appendLine({ type: "output", text: t(resolved === "party" ? "party" : "hireMe") });
      appendLine({ type: "life", text: "" });
      if (resolved === "sudo hire-me") {
        await wait(LIFE_MS + 300);
        scrollToSection("contact");
      }
      return;
    }

    const builtIn = runCommand(
      resolved,
      { ...data, locale, history: history.current, go: (path) => router.push(path) },
      t
    );
    if (builtIn !== null) {
      const text = typeof builtIn === "string" ? builtIn : await builtIn;
      appendLine({ type: "output", text });
      return;
    }

    // Otherwise the start of a command is never a question: several matches are listed,
    // one is typed in ready to run.
    if (started.length > 1) {
      const options = summarize(started, normalized).join(", ");
      appendLine({ type: "output", text: t("ambiguous", { cmd, options }) });
      showInInput(commonPrefix(started));
      return;
    }

    // A near miss stays in the terminal, with the right command typed in ready to run.
    const suggestion = started[0] ?? suggestCommand(normalized, commands);
    if (suggestion) {
      appendLine({
        type: "output",
        text: t("notFound", { cmd, suggestion }),
      });
      showInInput(suggestion);
      return;
    }

    // A single stray character isn't worth asking the AI about.
    if (normalized.length < 2) {
      appendLine({ type: "output", text: t("unknown", { cmd }) });
      return;
    }

    // Anything else is a question: hand it to the AI guide panel, so there's one AI and
    // one conversation (follow-ups and source links work there).
    openAiGuide(cmd);
    appendLine({ type: "ai", text: t("asking") });
  }

  /** Puts a line in the input with the cursor at its end (the arrow keys would move it). */
  function showInInput(text: string) {
    setInput(text);
    requestAnimationFrame(() => inputRef.current?.setSelectionRange(text.length, text.length));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing) return; // mid-word in an input method: leave its keys alone

    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      const past = history.current;
      if (past.length === 0) return;
      e.preventDefault();
      if (historyPos.current === past.length) draft.current = input;
      const pos =
        e.key === "ArrowUp"
          ? Math.max(0, historyPos.current - 1)
          : Math.min(past.length, historyPos.current + 1);
      historyPos.current = pos;
      showInInput(pos === past.length ? draft.current : past[pos]);
      return;
    }

    // Only a Tab that completes something is caught; otherwise it moves focus as usual,
    // so keyboard users are never stuck in the terminal.
    if (e.key === "Tab" && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
      const result = completeCommand(input, commands);
      if (!result) return;
      e.preventDefault();
      if ("fill" in result) showInInput(result.fill);
      else appendLine({ type: "output", text: result.options.join("   ") });
    }
  }

  // Always left to right, like a real terminal (the commands are English); each line still
  // lines up by its own language (dir="auto"), so Arabic output reads right to left.
  return (
    <div
      dir="ltr"
      className={`${className} rounded-lg border border-border bg-panel/80 shadow-lg backdrop-blur-sm transition-colors focus-within:border-accent/60`}
    >
      <div className="flex items-center gap-1.5 border-b border-border px-4 py-2">
        <span className="h-3 w-3 rounded-full bg-red-500/70" />
        <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
        <span className="h-3 w-3 rounded-full bg-green-500/70" />
        <span className="ml-3 font-mono text-xs text-gray-400">guest@portfolio:~</span>
      </div>

      <div ref={scrollRef} className="h-72 overflow-y-auto px-4 py-3 font-mono text-sm">
        {lines.map((line, i) =>
          line.type === "life" ? (
            <TerminalLife key={i} />
          ) : (
            <div
              key={i}
              dir="auto"
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
          )
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex border-t border-border px-4 py-2">
        <span className="mr-2 font-mono text-accent">{">"}</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent font-mono text-sm text-white outline-none"
          aria-label={t("ariaLabel")}
          placeholder={t("placeholder")}
          dir="auto"
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
