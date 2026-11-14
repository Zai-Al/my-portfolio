// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useState } from "react";

type Snippet = {
  language: string;
  lines: string[];
  buggyLine: number; // 0-indexed
  explanation: string;
};

const SNIPPETS: Snippet[] = [
  {
    language: "C#",
    lines: [
      "public int Sum(List<int> nums) {",
      "    int total = 0;",
      "    for (int i = 0; i <= nums.Count; i++) {",
      "        total += nums[i];",
      "    }",
      "    return total;",
      "}",
    ],
    buggyLine: 2,
    explanation:
      "`i <= nums.Count` runs one iteration too far and throws an IndexOutOfRangeException — should be `i < nums.Count`.",
  },
  {
    language: "JavaScript",
    lines: [
      "function debounce(fn, delay) {",
      "  let timer;",
      "  return (...args) => {",
      "    clearTimeout(timer);",
      "    timer = setTimeout(fn(...args), delay);",
      "  };",
      "}",
    ],
    buggyLine: 4,
    explanation:
      "`fn(...args)` calls fn immediately and passes its return value to setTimeout — should be `() => fn(...args)`.",
  },
  {
    language: "Java",
    lines: [
      "public boolean isPalindrome(String s) {",
      "    int left = 0, right = s.length() - 1;",
      "    while (left < right) {",
      "        if (s.charAt(left) != s.charAt(right))",
      "            return false;",
      "        left++;",
      "    }",
      "    return true;",
      "}",
    ],
    buggyLine: 5,
    explanation:
      "`right` never gets decremented, so the loop only ever compares the first character — should also do `right--`.",
  },
  {
    language: "C#",
    lines: [
      "public async Task<User?> FindUser(int id) {",
      "    var user = await _db.Users.FindAsync(id);",
      "    user.LastSeen = DateTime.UtcNow;",
      "    await _db.SaveChangesAsync();",
      "    return user;",
      "}",
    ],
    buggyLine: 2,
    explanation:
      "`FindAsync` can return null, so `user.LastSeen` risks a NullReferenceException — should null-check first.",
  },
];

export default function DebugTheBug() {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "correct" | "wrong" | "revealed">("idle");
  const [attempts, setAttempts] = useState(0);

  const snippet = SNIPPETS[index];

  function pickLine(i: number) {
    if (status === "correct" || status === "revealed") return;
    setSelected(i);
    if (i === snippet.buggyLine) {
      setStatus("correct");
    } else if (attempts >= 1) {
      setStatus("revealed");
    } else {
      setStatus("wrong");
      setAttempts((a) => a + 1);
    }
  }

  function next() {
    setIndex((i) => (i + 1) % SNIPPETS.length);
    setSelected(null);
    setStatus("idle");
    setAttempts(0);
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <p className="font-mono text-xs text-gray-500">{snippet.language} — click the buggy line</p>
      <pre className="w-full max-w-lg overflow-x-auto rounded border border-border bg-panel p-4 font-mono text-sm">
        {snippet.lines.map((line, i) => {
          const isSelected = selected === i;
          const isBug = i === snippet.buggyLine;
          const showResult = status === "correct" || status === "revealed";
          const cls =
            showResult && isBug
              ? "bg-green-500/20 text-green-300"
              : isSelected && status === "wrong"
                ? "bg-red-500/20 text-red-300"
                : "text-gray-300 hover:bg-white/5";
          return (
            <div
              key={i}
              onClick={() => pickLine(i)}
              className={`cursor-pointer whitespace-pre rounded px-2 py-0.5 ${cls}`}
            >
              {String(i + 1).padStart(2, " ")} {line}
            </div>
          );
        })}
      </pre>

      {status === "wrong" && (
        <p className="max-w-md text-center font-mono text-xs text-red-400">
          Not quite — one more try.
        </p>
      )}
      {(status === "correct" || status === "revealed") && (
        <p className="max-w-md text-center font-mono text-xs text-gray-400">
          {status === "correct" ? "✓ Correct. " : "Here's the bug: "}
          {snippet.explanation}
        </p>
      )}

      <button
        onClick={next}
        className="rounded border border-accent px-4 py-1 font-mono text-sm text-accent hover:bg-accent/10"
      >
        next snippet
      </button>
    </div>
  );
}
