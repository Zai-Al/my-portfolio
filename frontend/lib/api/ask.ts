// Copyright (c) 2026 Zainab Alawi. All rights reserved.

// The AI guide (chat widget and terminal). POST /api/ask streams the answer back as
// Server-Sent Events, so the text appears while Gemini is still writing it.

import { API_URL, ApiError } from "./http";

/** Must match AskController.MaxQuestionLength / MaxHistoryTurns in the backend. */
export const MAX_QUESTION_LENGTH = 500;
export const MAX_HISTORY_TURNS = 6;

export type AskTurn = { role: "user" | "assistant"; text: string };
/** Where an answer came from. anchor is "#experience", "#project-<slug>", "/playground", … */
export type AskSource = { type: string; title: string; anchor: string };
export type AskAnswer = { answer: string; sources: AskSource[] };

type StreamEvent =
  | { type: "delta"; text: string }
  | { type: "sources"; sources: AskSource[] }
  | { type: "done" }
  | { type: "error"; message: string };

/**
 * Asks a question. `onText` is called with the answer so far each time more arrives.
 * Throws ApiError: 400 too long, 429 rate limited, 503 AI unavailable (details[0] says why).
 */
export async function streamAsk(
  question: string,
  history: AskTurn[],
  onText: (answerSoFar: string) => void,
  signal?: AbortSignal
): Promise<AskAnswer> {
  const res = await fetch(`${API_URL}/api/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify({ question, history: history.slice(-MAX_HISTORY_TURNS) }),
    signal,
  });
  if (!res.ok || !res.body) {
    let message: string | undefined;
    try {
      message = (await res.json())?.message;
    } catch {
      // no JSON body
    }
    throw new ApiError(res.status, message ? [message] : [], `POST /api/ask failed: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let answer = "";
  let sources: AskSource[] = [];

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Events are separated by a blank line; keep a half-received one for the next read.
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const raw of events) {
      const data = raw
        .split("\n")
        .filter((l) => l.startsWith("data:"))
        .map((l) => l.slice(5).trim())
        .join("");
      if (!data) continue;
      const event = JSON.parse(data) as StreamEvent;
      if (event.type === "delta") {
        answer += event.text;
        onText(answer);
      } else if (event.type === "sources") {
        sources = event.sources;
      } else if (event.type === "error") {
        throw new ApiError(502, [event.message], event.message);
      }
    }
  }
  return { answer: answer.trim(), sources };
}

/** A short, friendly line for any failure from streamAsk. */
export function askErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 429)
      return "Easy there - that's a lot of questions. Give it a minute and try again.";
    if (err.status === 400)
      return `That question is too long - keep it under ${MAX_QUESTION_LENGTH} characters.`;
    if (err.details[0]) return err.details[0];
  }
  return "Couldn't reach the AI right now - try again in a moment.";
}
