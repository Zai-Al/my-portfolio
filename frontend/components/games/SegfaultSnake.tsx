// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const COLS = 20;
const ROWS = 20;
const TICK_MS = 120;

type Point = { x: number; y: number };

const ERROR_MESSAGES = [
  "NullPointerException: snake.length",
  "Segmentation fault (core dumped)",
  "Uncaught TypeError: Cannot read properties of dead snake",
  "panic: runtime error: index out of range [snake]",
  "fatal error: stack overflow (too much snake)",
  "error[E0499]: cannot borrow `snake` as mutable more than once",
];

function randomFood(snake: Point[]): Point {
  let food: Point;
  do {
    food = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    };
  } while (snake.some((s) => s.x === food.x && s.y === food.y));
  return food;
}

function initialSnake(): Point[] {
  return [{ x: 10, y: 10 }];
}

export default function SegfaultSnake() {
  const [snake, setSnake] = useState<Point[]>(initialSnake);
  // No food until the page is running in the browser: a random position picked during
  // server rendering wouldn't match the browser's, leaving a stale square nobody can eat.
  const [food, setFood] = useState<Point | null>(null);
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // The game loop reads these refs, so a tick always sees the latest values.
  const snakeRef = useRef(snake);
  const foodRef = useRef(food);
  const runningRef = useRef(running);
  // Direction for the next step, and the direction of the last step actually taken.
  // Turns are checked against the last step, so two quick key presses can't reverse the snake.
  const directionRef = useRef<Point>({ x: 1, y: 0 });
  const movedRef = useRef<Point>({ x: 1, y: 0 });

  // Change food/running through these, so the refs above always match the state.
  const placeFood = useCallback((p: Point) => {
    foodRef.current = p;
    setFood(p);
  }, []);
  const setRun = useCallback((r: boolean) => {
    runningRef.current = r;
    setRunning(r);
  }, []);

  useEffect(() => {
    // Placed in the browser after load (see the comment on `food` above).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    placeFood(randomFood(initialSnake()));
  }, [placeFood]);

  const start = useCallback(() => {
    const fresh = initialSnake();
    snakeRef.current = fresh;
    setSnake(fresh);
    placeFood(randomFood(fresh));
    directionRef.current = { x: 1, y: 0 };
    movedRef.current = { x: 1, y: 0 };
    setGameOver(false);
    setRun(true);
  }, [placeFood, setRun]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const turns: Record<string, Point> = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
      };
      const turn = turns[e.key];
      if (!turn || !runningRef.current) return;
      e.preventDefault(); // keep the page from scrolling while steering
      const last = movedRef.current;
      const reverses = turn.x === -last.x && turn.y === -last.y;
      if (!reverses) directionRef.current = turn;
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      const prev = snakeRef.current;
      const head = prev[0];
      const d = directionRef.current;
      const next: Point = { x: head.x + d.x, y: head.y + d.y };

      const hitsWall = next.x < 0 || next.x >= COLS || next.y < 0 || next.y >= ROWS;
      const hitsSelf = prev.some((s) => s.x === next.x && s.y === next.y);

      if (hitsWall || hitsSelf) {
        setRun(false);
        setGameOver(true);
        setErrorMsg(ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)]);
        return;
      }

      const current = foodRef.current;
      const ateFood = current !== null && next.x === current.x && next.y === current.y;
      const body = [next, ...prev];
      if (!ateFood) body.pop();

      movedRef.current = d;
      snakeRef.current = body;
      setSnake(body);
      if (ateFood) placeFood(randomFood(body));
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [running, placeFood, setRun]);

  const cellSet = new Set(snake.map((s) => `${s.x},${s.y}`));

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        <button
          onClick={start}
          className="rounded border border-accent px-4 py-1 font-mono text-sm text-accent hover:bg-accent/10"
        >
          {gameOver ? "play again" : running ? "restart" : "start"}
        </button>
        <span className="font-mono text-xs text-gray-500">score: {snake.length - 1}</span>
      </div>

      <div
        className="relative grid gap-[1px] rounded border border-border bg-border p-[1px]"
        style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: ROWS }).map((_, y) =>
          Array.from({ length: COLS }).map((_, x) => {
            const isSnake = cellSet.has(`${x},${y}`);
            const isFood = food !== null && food.x === x && food.y === y;
            return (
              <div
                key={`${x}-${y}`}
                className={`h-5 w-5 ${
                  isSnake ? "bg-accent" : isFood ? "bg-aurora-purple" : "bg-panel"
                }`}
              />
            );
          })
        )}

        {gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-void/90 p-4">
            <p className="max-w-[15rem] text-center font-mono text-xs text-red-400">{errorMsg}</p>
          </div>
        )}
      </div>

      <p className="max-w-md text-center font-mono text-xs text-gray-500">
        Arrow keys to move. Replayable instantly, no score saved.
      </p>
    </div>
  );
}
