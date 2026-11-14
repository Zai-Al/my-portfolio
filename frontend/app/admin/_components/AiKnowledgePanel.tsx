// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useCallback, useEffect, useState } from "react";
import { getKnowledgeStatus, rebuildKnowledge, type KnowledgeStatus } from "@/lib/api/admin";
import { describeError } from "../_lib/describeError";

/**
 * The AI guide's knowledge: how much site content it has, and a button to rebuild it.
 * Rebuilds also happen by themselves after every save; the button is for when Gemini was
 * out of quota, or content was changed outside the admin portal (e.g. a SQL script).
 */
export default function AiKnowledgePanel({ token }: { token: string }) {
  const [status, setStatus] = useState<KnowledgeStatus | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setStatus(await getKnowledgeStatus(token));
      setError("");
    } catch (e) {
      setError(describeError(e));
    }
  }, [token]);

  // First load once the panel opens (callbacks, not the effect body, set the state).
  useEffect(() => {
    let cancelled = false;
    getKnowledgeStatus(token)
      .then((s) => !cancelled && setStatus(s))
      .catch((e) => !cancelled && setError(describeError(e)));
    return () => {
      cancelled = true;
    };
  }, [token]);

  // While a rebuild is queued or running, check again every few seconds.
  const working = status?.state === "queued" || status?.state === "running";
  useEffect(() => {
    if (!working) return;
    const timer = setInterval(load, 4000);
    return () => clearInterval(timer);
  }, [working, load]);

  async function rebuild() {
    try {
      await rebuildKnowledge(token);
      await load();
    } catch (e) {
      setError(describeError(e));
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold">AI knowledge</h2>
        <button
          type="button"
          onClick={rebuild}
          disabled={working}
          className="rounded border border-accent px-3 py-1 font-mono text-xs text-accent hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {working ? "rebuilding…" : "Rebuild AI knowledge"}
        </button>
      </div>
      <p className="mt-1 text-sm text-gray-400">
        The chatbot answers from this. It rebuilds by itself shortly after every save; only new or
        changed text is sent to Gemini.
      </p>

      {error && (
        <p role="alert" className="mt-3 font-mono text-sm text-red-400">
          {error}
        </p>
      )}

      {status && (
        <dl className="mt-3 grid gap-x-6 gap-y-1 rounded border border-border bg-panel/40 px-4 py-3 font-mono text-xs text-gray-300 sm:grid-cols-[auto_1fr]">
          <dt className="text-gray-500">status</dt>
          <dd>{status.state}</dd>
          <dt className="text-gray-500">chunks</dt>
          <dd>
            {status.embedded} of {status.chunks} searchable by meaning
            {status.embedded < status.chunks && " (the rest by keywords until the next rebuild)"}
          </dd>
          <dt className="text-gray-500">last rebuild</dt>
          <dd>
            {status.lastFinishedAt
              ? `${new Date(status.lastFinishedAt).toLocaleString()} - ${status.lastMessage ?? ""}`
              : "not since the server started"}
          </dd>
        </dl>
      )}
    </section>
  );
}
