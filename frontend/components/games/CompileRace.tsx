// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useState, useRef, useEffect } from "react";

const SNIPPETS = [
  `public async Task<IActionResult> GetAll() =>
    Ok(await _db.Projects.OrderBy(p => p.SortOrder).ToListAsync());`,
  `function step(grid) {
  return grid.map((row, r) => row.map((c, i) => alive(grid, r, i)));
}`,
  `const debounced = useCallback(
  debounce((v) => setQuery(v), 300),
  []
);`,
];

function pickSnippet() {
  return SNIPPETS[Math.floor(Math.random() * SNIPPETS.length)];
}

export default function CompileRace() {
  const [snippet, setSnippet] = useState(SNIPPETS[0]);
  const [typed, setTyped] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState<{ wpm: number; accuracy: number } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Picked in the browser after load: a random pick during server rendering wouldn't match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSnippet(pickSnippet());
  }, []);

  function handleChange(value: string) {
    if (finished) return;
    if (startedAt === null && value.length > 0) setStartedAt(Date.now());

    setTyped(value);

    if (value.length >= snippet.length) {
      const elapsedMs = Date.now() - (startedAt ?? Date.now());
      const minutes = Math.max(elapsedMs / 60000, 1 / 60000);
      const words = snippet.length / 5;
      let correct = 0;
      for (let i = 0; i < snippet.length; i++) {
        if (value[i] === snippet[i]) correct++;
      }
      setResult({
        wpm: Math.round(words / minutes),
        accuracy: Math.round((correct / snippet.length) * 100),
      });
      setFinished(true);
    }
  }

  function reset() {
    setSnippet(pickSnippet());
    setTyped("");
    setStartedAt(null);
    setFinished(false);
    setResult(null);
    inputRef.current?.focus();
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex h-[400px] w-[400px] max-w-full flex-col overflow-y-auto rounded border border-border bg-panel">
        <pre className="w-full overflow-x-auto whitespace-pre-wrap p-4 font-mono text-sm">
          {snippet.split("").map((ch, i) => {
            const typedCh = typed[i];
            const cls =
              typedCh === undefined
                ? "text-gray-500"
                : typedCh === ch
                  ? "text-accent"
                  : "bg-red-500/30 text-red-300";
            return (
              <span key={i} className={cls}>
                {ch}
              </span>
            );
          })}
        </pre>

        <textarea
          ref={inputRef}
          value={typed}
          onChange={(e) => handleChange(e.target.value)}
          disabled={finished}
          placeholder="start typing to begin..."
          className="w-full flex-1 resize-none border-t border-border bg-void px-3 py-2 font-mono text-sm text-white outline-none focus:border-accent disabled:opacity-50"
        />
      </div>

      {result && (
        <p className="font-mono text-sm text-gray-300">
          {result.wpm} WPM · {result.accuracy}% accuracy
        </p>
      )}

      <button
        onClick={reset}
        className="rounded border border-accent px-4 py-1 font-mono text-sm text-accent hover:bg-accent/10"
      >
        try again
      </button>
    </div>
  );
}
