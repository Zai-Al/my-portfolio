// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useEffect, useState } from "react";

const ROWS = 18;
const COLS = 30;
const TICK_MS = 150;

type Grid = boolean[][];

function emptyGrid(): Grid {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(false));
}

function countNeighbors(grid: Grid, r: number, c: number): number {
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc]) {
        count++;
      }
    }
  }
  return count;
}

// Conway's rules: a live cell survives with 2 or 3 live neighbours; an empty cell
// comes alive with exactly 3. Everything else is empty on the next step.
function step(grid: Grid): Grid {
  return grid.map((row, r) =>
    row.map((alive, c) => {
      const n = countNeighbors(grid, r, c);
      if (alive) return n === 2 || n === 3;
      return n === 3;
    })
  );
}

const sameGrid = (a: Grid, b: Grid) => a.every((row, r) => row.every((v, c) => v === b[r][c]));
const liveCount = (g: Grid) => g.reduce((sum, row) => sum + row.filter(Boolean).length, 0);

// A glider: five cells that keep "walking" diagonally across the grid.
function gliderGrid(): Grid {
  const g = emptyGrid();
  for (const [r, c] of [
    [1, 2],
    [2, 3],
    [3, 1],
    [3, 2],
    [3, 3],
  ])
    g[r][c] = true;
  return g;
}

// About a quarter of the cells alive: usually settles into interesting shapes.
function randomGrid(): Grid {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => Math.random() < 0.25)
  );
}

export default function GameOfLife() {
  const [grid, setGrid] = useState<Grid>(emptyGrid);
  const [running, setRunning] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [message, setMessage] = useState("");

  // One interval per run: pausing clears it, so pause/run quickly can't start two loops.
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setGrid((g) => {
        const next = step(g);
        if (liveCount(next) === 0) {
          setRunning(false);
          setMessage(
            "Everything died - cells need 2-3 live neighbours to survive. Try placing them touching."
          );
        } else if (sameGrid(g, next)) {
          setRunning(false);
          setMessage("The pattern is stable - nothing changes any more.");
        }
        return next;
      });
      setGeneration((n) => n + 1);
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [running]);

  function load(next: Grid) {
    setRunning(false);
    setGrid(next);
    setGeneration(0);
    setMessage("");
  }

  function toggleCell(r: number, c: number) {
    setMessage("");
    setGrid((g) => {
      const copy = g.map((row) => [...row]);
      copy[r][c] = !copy[r][c];
      return copy;
    });
  }

  function toggleRunning() {
    if (!running && liveCount(grid) === 0) {
      setMessage("Click some cells first, or try a glider / random start.");
      return;
    }
    setMessage("");
    setRunning((r) => !r);
  }

  const button =
    "rounded border px-4 py-1 font-mono text-sm transition-colors border-border text-gray-300 hover:bg-white/5";

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={toggleRunning}
          className="rounded border border-accent px-4 py-1 font-mono text-sm text-accent hover:bg-accent/10"
        >
          {running ? "pause" : "run"}
        </button>
        <button onClick={() => load(gliderGrid())} className={button}>
          glider
        </button>
        <button onClick={() => load(randomGrid())} className={button}>
          random
        </button>
        <button onClick={() => load(emptyGrid())} className={button}>
          clear
        </button>
      </div>

      <p className="font-mono text-xs text-gray-500">
        step {generation} · {liveCount(grid)} alive
      </p>

      <div
        className="grid w-full max-w-[32rem] gap-[1px] rounded border border-border bg-border p-[1px]"
        style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
      >
        {grid.map((row, r) =>
          row.map((alive, c) => (
            <button
              key={`${r}-${c}`}
              onClick={() => toggleCell(r, c)}
              className={`aspect-square w-full ${alive ? "bg-accent" : "bg-panel hover:bg-white/10"}`}
              aria-label={`cell ${r + 1},${c + 1}`}
              aria-pressed={alive}
            />
          ))
        )}
      </div>

      <p
        className="min-h-[1rem] max-w-md text-center font-mono text-xs text-amber-300/80"
        role="status"
      >
        {message}
      </p>
      <p className="max-w-md text-center font-mono text-xs text-gray-500">
        Click cells to bring them to life, then hit run. Each step, a live cell survives with 2-3
        live neighbours, and an empty cell is born with exactly 3. Cells placed far apart die
        straight away - try a glider.
      </p>
    </div>
  );
}
