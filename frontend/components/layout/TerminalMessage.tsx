// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { usePathname } from "next/navigation";

/**
 * The 404 and error pages: a small terminal window showing the command that "failed" and
 * its error, a plain-language hint, and the ways out. `{path}` in the command or the error
 * is replaced by the address that was asked for.
 */
export default function TerminalMessage({
  code,
  command,
  error,
  hint,
  children,
}: {
  /** Big label above the window, e.g. "404". */
  code: string;
  command: string;
  error: string;
  hint: string;
  /** Buttons or links (the ways out). */
  children: React.ReactNode;
}) {
  const path = usePathname() ?? "/";
  const fill = (text: string) => text.replace("{path}", path);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 text-center">
      <p className="font-display text-6xl font-bold text-accent md:text-7xl">{code}</p>
      {/* Left to right like the home page terminal; each line follows its own language. */}
      <div
        dir="ltr"
        className="w-full rounded-lg border border-border bg-panel/80 text-start shadow-lg backdrop-blur-sm"
      >
        <div className="flex items-center gap-1.5 border-b border-border px-4 py-2">
          <span className="h-3 w-3 rounded-full bg-red-500/70" />
          <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
          <span className="h-3 w-3 rounded-full bg-green-500/70" />
          <span className="ml-3 font-mono text-xs text-gray-400">guest@portfolio:~</span>
        </div>
        <div className="space-y-1 px-4 py-4 font-mono text-sm">
          <p dir="auto" className="break-all text-accent">
            {"> "}
            {fill(command)}
          </p>
          <p dir="auto" className="break-all text-red-400">
            {fill(error)}
          </p>
        </div>
      </div>
      <p className="text-gray-300">{hint}</p>
      <div className="flex flex-wrap justify-center gap-3 font-mono text-sm">{children}</div>
    </div>
  );
}

/** The look of the ways-out buttons and links on these pages. */
export const actionClass =
  "rounded border border-accent px-5 py-2 text-accent transition-colors hover:bg-accent/10";
