// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FaPaperPlane, FaRobot } from "react-icons/fa";
import {
  MAX_QUESTION_LENGTH,
  askErrorMessage,
  streamAsk,
  type AskSource,
  type AskTurn,
} from "@/lib/api/ask";
import { AI_GUIDE_EVENT, type AiGuideRequest } from "@/lib/aiGuide";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { useSlowHint } from "@/lib/useSlowHint";

type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
  sources?: AskSource[];
  /** Error replies aren't sent back to the AI as history. */
  error?: boolean;
};

type ChatWidgetProps = {
  /** From SiteSettings.FullName; the widget says "Ask about <first name>". */
  ownerName: string | null;
  /** Starter questions: the first few Guide titles (reorder guides in the admin portal to change them). */
  suggestions: string[];
};

let nextId = 1;

/**
 * The site's one AI guide: a chat panel written in the home page terminal's style (title
 * bar, mono text, ">" prompt). An "Ask AI" button in the bottom-right corner opens it; the home page terminal also
 * opens it (see lib/aiGuide.ts) when someone types a question there. Answers stream from
 * /api/ask (RAG over the site's own content) and end with links to where they came from.
 * Esc closes; the conversation stays until the page reloads.
 */
export default function ChatWidget({ ownerName, suggestions }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const pathname = usePathname();

  const firstName = ownerName?.trim().split(/\s+/)[0] || null;
  const title = firstName ? `Ask about ${firstName}` : "Ask the AI guide";

  // Waiting for the first words of an answer (the free server may be waking up).
  const waiting = busy && messages[messages.length - 1]?.text === "";
  const waking = useSlowHint(waiting, 5000);

  useFocusTrap(panelRef, open, () => setOpen(false));

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages, open]);

  // Stop a half-finished answer if the visitor leaves the page.
  useEffect(() => () => abortRef.current?.abort(), []);

  // Questions handed over from elsewhere on the page (the home page terminal).
  const onRequest = useEffectEvent((e: Event) => {
    const question = (e as CustomEvent<AiGuideRequest>).detail?.question;
    setOpen(true);
    if (question) ask(question);
  });
  useEffect(() => {
    const handler = (e: Event) => onRequest(e);
    window.addEventListener(AI_GUIDE_EVENT, handler);
    return () => window.removeEventListener(AI_GUIDE_EVENT, handler);
  }, []);

  const update = (id: number, patch: Partial<Message>) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  async function ask(raw: string) {
    const question = raw.trim().slice(0, MAX_QUESTION_LENGTH);
    if (!question || busy) return;

    const history: AskTurn[] = messages
      .filter((m) => !m.error && m.text)
      .map((m) => ({ role: m.role, text: m.text.slice(0, 2000) }));
    const botId = nextId++;
    setMessages((prev) => [
      ...prev,
      { id: nextId++, role: "user", text: question },
      { id: botId, role: "assistant", text: "" },
    ]);
    setInput("");
    setBusy(true);

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const { answer, sources } = await streamAsk(
        question,
        history,
        (text) => update(botId, { text }),
        controller.signal
      );
      update(botId, { text: answer || "No answer came back - try asking again.", sources });
    } catch (err) {
      if (controller.signal.aborted) return;
      update(botId, { text: askErrorMessage(err), error: true });
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  // Source links: scroll to a section, or open a project's details popup.
  function goTo(anchor: string) {
    setOpen(false);
    if (!anchor.startsWith("#")) return router.push(anchor);
    if (pathname !== "/") return router.push(`/${anchor}`);

    if (anchor.startsWith("#project-")) {
      // ProjectsSection opens the project named in the hash.
      history.replaceState(null, "", anchor);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
      return;
    }
    document
      .getElementById(anchor.slice(1))
      ?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }

  const pop = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 16, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 16, scale: 0.98 },
      };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={title}
          title={title}
          className="fixed bottom-20 right-4 z-50 flex items-center gap-2 rounded-full border border-accent/60 bg-panel/90 px-4 py-3 font-mono text-sm text-accent shadow-[0_8px_30px_-6px_rgba(0,255,157,0.45)] backdrop-blur transition-colors hover:border-accent hover:bg-panel md:bottom-6 md:right-6"
        >
          <FaRobot className="h-5 w-5" aria-hidden />
          <span>Ask AI</span>
          <span
            className="h-4 w-[2px] animate-pulse bg-accent/80 motion-reduce:animate-none"
            aria-hidden
          />
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            {...pop}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
            className="fixed inset-x-2 bottom-2 z-50 flex h-[min(80dvh,560px)] flex-col overflow-hidden rounded-lg border border-border bg-panel/95 font-mono text-sm shadow-2xl backdrop-blur-md outline-none transition-colors focus-within:border-accent/60 md:inset-x-auto md:bottom-6 md:right-6 md:w-[420px]"
          >
            {/* Title bar, same as the home page terminal; the red dot closes. */}
            <div className="flex items-center gap-1.5 border-b border-border px-4 py-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close the AI guide"
                title="Close (Esc)"
                className="group flex h-3 w-3 items-center justify-center rounded-full bg-red-500/70 hover:bg-red-500"
              >
                <span className="text-[9px] leading-none text-void opacity-0 group-hover:opacity-100">
                  ×
                </span>
              </button>
              <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
              <span className="h-3 w-3 rounded-full bg-green-500/70" />
              <span className="ml-3 truncate text-xs text-gray-400">
                guest@portfolio:~/ai-guide
              </span>
              <span className="ml-auto text-[10px] text-gray-500">esc to close</span>
            </div>
            <div className="flex items-center gap-3 border-b border-border bg-void/30 px-4 py-3">
              <Avatar size="lg" />
              <div className="min-w-0">
                <h2 className="truncate font-display text-base font-semibold text-white">
                  {title}
                </h2>
                <p className="flex items-center gap-1.5 text-[11px] text-gray-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
                  AI guide · answers from this portfolio
                </p>
              </div>
            </div>

            <div
              ref={logRef}
              role="log"
              aria-live="polite"
              aria-busy={busy}
              className="flex-1 space-y-3 overflow-y-auto px-4 py-3"
            >
              <Bot>
                <p className="text-gray-200">
                  {`Hi! I'm the AI guide.${firstName ? ` Ask me anything about ${firstName}` : " Ask me anything"} - experience, projects, skills, or how to use this site.`}
                </p>
              </Bot>

              {messages.length === 0 && suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 pl-9">
                  {suggestions.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => ask(q)}
                      className="rounded-full border border-border px-3 py-1.5 text-left text-xs text-aurora-teal transition-colors hover:border-accent/60 hover:text-accent"
                    >
                      <span className="text-gray-500">$ </span>
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((m) =>
                m.role === "user" ? (
                  <p
                    key={m.id}
                    className="ml-auto w-fit max-w-[85%] whitespace-pre-wrap break-words rounded-lg rounded-br-sm border border-accent/30 bg-accent/10 px-3 py-2 text-accent"
                  >
                    <span className="text-accent/60">{"> "}</span>
                    {m.text}
                  </p>
                ) : (
                  <Bot key={m.id}>
                    {m.text === "" ? (
                      <Thinking waking={waking} />
                    ) : (
                      <p
                        className={`whitespace-pre-wrap break-words leading-relaxed ${m.error ? "text-amber-300" : "text-gray-200"}`}
                      >
                        {m.text.replace(/\*\*/g, "")}
                        {busy && m.id === messages[messages.length - 1]?.id && <Cursor />}
                      </p>
                    )}
                    {!!m.sources?.length && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {m.sources.map((src) => (
                          <a
                            key={`${src.type}-${src.anchor}-${src.title}`}
                            href={
                              src.anchor.startsWith("#") && pathname !== "/"
                                ? `/${src.anchor}`
                                : src.anchor
                            }
                            onClick={(e) => {
                              e.preventDefault();
                              goTo(src.anchor);
                            }}
                            className="rounded border border-aurora-purple/40 px-2 py-0.5 text-[11px] text-aurora-purple transition-colors hover:border-aurora-purple hover:text-white"
                          >
                            ↗ {src.title}
                          </a>
                        ))}
                      </div>
                    )}
                  </Bot>
                )
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                ask(input);
              }}
              className="flex items-center gap-2 border-t border-border px-3 py-3"
            >
              <div className="flex min-w-0 flex-1 items-center rounded-md border border-border bg-void/60 px-3 py-2 transition-colors focus-within:border-accent/60">
                <span className="mr-2 text-accent" aria-hidden>
                  {">"}
                </span>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  maxLength={MAX_QUESTION_LENGTH}
                  placeholder={busy ? "answering…" : "ask a question..."}
                  aria-label="Your question"
                  autoComplete="off"
                  className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={busy || !input.trim()}
                aria-label="Send"
                className="rounded-md border border-accent/60 p-2.5 text-accent transition-colors hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FaPaperPlane aria-hidden />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** The robot's side of the chat: avatar on the left, message next to it. */
function Bot({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <Avatar />
      <div className="min-w-0 max-w-[88%] rounded-lg rounded-tl-sm border border-border bg-void/40 px-3 py-2">
        {children}
      </div>
    </div>
  );
}

function Avatar({ size = "sm" }: { size?: "sm" | "lg" }) {
  const box = size === "lg" ? "h-9 w-9" : "h-7 w-7";
  const icon = size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <span
      className={`flex ${box} shrink-0 items-center justify-center rounded-full border border-accent/50 bg-accent/10 text-accent`}
      aria-hidden
    >
      <FaRobot className={icon} />
    </span>
  );
}

function Cursor() {
  return (
    <span
      className="ml-0.5 inline-block h-[1em] w-[0.5em] translate-y-[2px] animate-pulse bg-accent/70 motion-reduce:animate-none"
      aria-hidden
    />
  );
}

function Thinking({ waking }: { waking: boolean }) {
  return (
    <div role="status" className="flex items-center gap-2 text-gray-400">
      <span className="flex gap-1" aria-hidden>
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent/70 motion-reduce:animate-none"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </span>
      <span className="text-xs">
        {waking
          ? "waking up the server... the first answer can take up to a minute"
          : "thinking..."}
      </span>
    </div>
  );
}
