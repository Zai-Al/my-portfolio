// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useConfirm } from "@/components/ui/ConfirmDialog";
import { adminDelete, adminPatch } from "@/lib/api/admin";
import type { SystemLogEntry } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { useListSearch } from "../_hooks/useListSearch";
import { SYSTEM_LOG_SEARCH } from "../_lib/searchConfig";
import { FilterChips, SearchPanel, SearchToggle } from "./SearchPanel";

const LEVEL_STYLE: Record<SystemLogEntry["level"], string> = {
  Warning: "border-yellow-500/50 text-yellow-300",
  Error: "border-red-500/50 text-red-400",
  Critical: "border-red-500 bg-red-500/15 text-red-300",
};

/** "PortfolioApi.Services.Gemini.GeminiClient" → "GeminiClient" (the full name is in the tooltip). */
const shortSource = (source: string) => source.split(".").at(-1) || source;

/**
 * Problems the API logged, one row per distinct problem: how often and when it happened,
 * the latest message and its details. Mark one resolved (it reopens if it happens again),
 * delete it, or clear every resolved one. Resolved problems also go on their own after 30 days.
 */
export default function SystemLog({
  token,
  entries,
  onChanged,
  onError,
}: {
  token: string;
  entries: SystemLogEntry[];
  onChanged: () => void;
  onError: (e: unknown) => void;
}) {
  const [confirm, confirmDialog] = useConfirm();
  const search = useListSearch(entries, SYSTEM_LOG_SEARCH);
  const { filtered } = search;
  const resolvedCount = entries.filter((e) => e.resolved).length;

  async function run(action: () => Promise<unknown>) {
    try {
      await action();
      onChanged();
    } catch (e) {
      onError(e);
    }
  }

  const toggleResolved = (e: SystemLogEntry) =>
    run(() => adminPatch(`/api/system-log/${e.id}`, token, { resolved: !e.resolved }));

  async function remove(e: SystemLogEntry) {
    const ok = await confirm({
      title: "Delete this problem from the log?",
      message: "If it happens again it comes back as a new entry.",
      confirmLabel: "delete",
      danger: true,
    });
    if (ok) await run(() => adminDelete(`/api/system-log/${e.id}`, token));
  }

  async function clearResolved() {
    const ok = await confirm({
      title: `Delete ${resolvedCount} resolved ${resolvedCount === 1 ? "problem" : "problems"}?`,
      message: "Open problems stay. This can't be undone.",
      confirmLabel: "delete",
      danger: true,
    });
    if (ok) await run(() => adminDelete("/api/system-log/resolved", token));
  }

  return (
    <section>
      {entries.length > 0 && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <FilterChips search={search} className="" />
            <div className="flex items-center gap-2">
              {resolvedCount > 0 && (
                <button
                  onClick={clearResolved}
                  className="rounded border border-red-500/40 px-2 py-1 font-mono text-xs text-red-400 hover:bg-red-500/10"
                >
                  clear resolved ({resolvedCount})
                </button>
              )}
              <SearchToggle search={search} />
            </div>
          </div>
          <SearchPanel search={search} />
        </>
      )}

      <ul className="mt-3 space-y-2">
        {filtered.map((e) => (
          <li
            key={e.id}
            className={`rounded border p-3 font-mono text-sm ${
              e.resolved ? "border-border text-gray-500" : "border-accent/30 text-gray-200"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={`rounded border px-1.5 py-0.5 ${LEVEL_STYLE[e.level]}`}>
                    {e.level}
                  </span>
                  <span title={e.source} className="text-gray-400">
                    {shortSource(e.source)}
                  </span>
                  <span className="text-gray-400">
                    ×{e.count} · last {formatDateTime(e.lastSeen)}
                    {e.count > 1 && ` · first ${formatDateTime(e.firstSeen)}`}
                  </span>
                  {e.resolved && <span className="text-accent">resolved</span>}
                </p>
                <p className="mt-1.5 whitespace-pre-wrap break-words">{e.message}</p>
                {(e.exceptionType || e.stackTrace) && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-200">
                      details{e.exceptionType && `: ${e.exceptionType}`}
                    </summary>
                    {e.stackTrace && (
                      <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded bg-void p-2 text-[11px] text-gray-400">
                        {e.stackTrace}
                      </pre>
                    )}
                  </details>
                )}
              </div>
              <span className="flex shrink-0 flex-col gap-2">
                <button
                  onClick={() => toggleResolved(e)}
                  className="rounded border border-border px-2 py-1 text-xs text-gray-300 hover:bg-white/5"
                >
                  {e.resolved ? "reopen" : "mark resolved"}
                </button>
                <button
                  onClick={() => remove(e)}
                  className="rounded border border-red-500/40 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10"
                >
                  delete
                </button>
              </span>
            </div>
          </li>
        ))}
        {entries.length === 0 && (
          <li className="font-mono text-sm text-gray-500">no problems logged - all quiet</li>
        )}
        {entries.length > 0 && filtered.length === 0 && (
          <li className="font-mono text-sm text-gray-500">no matches</li>
        )}
      </ul>
      {confirmDialog}
    </section>
  );
}
