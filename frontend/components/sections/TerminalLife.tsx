// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useEffect, useState } from "react";

const ROWS = 7; // like a week in GitHub's contribution graph
const COLS = 40;
const TICK_MS = 110;
/** How long the burst runs before it settles (the terminal waits this long after it). */
export const LIFE_MS = 3000;

// Age 0 = just born. Older cells shift through the aurora colours; empty cells stay faint,
// like the blank days in a contribution graph.
type Grid = number[][]; // -1 = empty, otherwise the cell's age in generations

function randomGrid(density = 0.32): Grid {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => (Math.random() < density ? 0 : -1))
  );
}

// Conway's rules on a grid whose edges wrap around, so patterns don't die at the border.
function step(grid: Grid): Grid {
  const next = grid.map((row, r) =>
    row.map((age, c) => {
      let n = 0;
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++)
          if ((dr || dc) && grid[(r + dr + ROWS) % ROWS][(c + dc + COLS) % COLS] >= 0) n++;
      if (age >= 0) return n === 2 || n === 3 ? age + 1 : -1;
      return n === 3 ? 0 : -1;
    })
  );
  // A tiny grid can die out or freeze within a few steps: sprinkle in new cells to keep it lively.
  const alive = next.flat().filter((a) => a >= 0).length;
  if (alive < (ROWS * COLS) / 8)
    for (let i = 0; i < 12; i++)
      next[Math.floor(Math.random() * ROWS)][Math.floor(Math.random() * COLS)] = 0;
  return next;
}

function cellColor(age: number): string {
  if (age < 0) return "bg-white/[0.06]";
  if (age === 0) return "bg-aurora-teal";
  if (age < 3) return "bg-aurora-blue";
  return "bg-aurora-purple";
}

/**
 * A short burst of Game of Life inside the terminal (`sudo hire-me`, `party`). Runs for
 * LIFE_MS, then freezes. With reduced motion it shows a single still frame.
 */
export default function TerminalLife() {
  const [grid, setGrid] = useState<Grid>(() => randomGrid());
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Reduced motion: the first frame just stays as it is.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setGrid(step), TICK_MS);
    const stop = setTimeout(() => {
      clearInterval(timer);
      setDone(true);
    }, LIFE_MS);
    return () => {
      clearInterval(timer);
      clearTimeout(stop);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`my-2 grid max-w-xl gap-[3px] transition-opacity duration-700 ${done ? "opacity-60" : ""}`}
      style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
    >
      {grid.flat().map((age, i) => (
        <span
          key={i}
          className={`aspect-square rounded-[2px] transition-colors duration-100 ${cellColor(age)}`}
        />
      ))}
    </div>
  );
}
