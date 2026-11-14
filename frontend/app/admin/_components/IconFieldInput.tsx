// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useId, useState } from "react";
import DynamicIcon, { ICON_NAMES, isKnownIcon } from "@/components/ui/DynamicIcon";

/**
 * Icon name field: shows the icon exactly as the site will draw it, warns when the
 * name isn't one the site knows (it would fall back to FaCode), and offers a picker
 * that filters by what's typed.
 */
export default function IconFieldInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (raw: string) => void;
}) {
  const [picking, setPicking] = useState(false);
  const id = useId();
  const name = value.trim();
  const known = isKnownIcon(name);

  // While typing a partial name, the picker narrows to matching icons.
  const query = known ? "" : name.toLowerCase();
  const matches = query ? ICON_NAMES.filter((n) => n.toLowerCase().includes(query)) : ICON_NAMES;

  return (
    <div className="sm:col-span-2">
      <label htmlFor={`${id}-input`} className="font-mono text-xs text-gray-400">
        {label}
      </label>
      <div className="mt-1 flex items-center gap-2">
        <span
          aria-hidden="true"
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded border bg-void ${
            known ? "border-accent/50 text-accent" : "border-border text-gray-500"
          }`}
        >
          <DynamicIcon name={name} className="h-5 w-5" />
        </span>
        <input
          id={`${id}-input`}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. FaDocker"
          aria-describedby={`${id}-status`}
          className="w-full rounded border border-border bg-void px-2 py-1.5 font-mono text-sm text-white outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={() => setPicking((p) => !p)}
          aria-expanded={picking}
          aria-controls={`${id}-picker`}
          className="shrink-0 rounded border border-border px-3 py-1.5 font-mono text-xs text-gray-300 hover:bg-white/5"
        >
          {picking ? "close" : "choose"}
        </button>
      </div>

      <p
        id={`${id}-status`}
        className={`mt-1 font-mono text-xs ${known ? "text-gray-500" : "text-amber-400"}`}
      >
        {known
          ? "This is how it looks on the site."
          : name
            ? `"${name}" isn't in the site's icon list, so the site shows the </> fallback. Choose one instead.`
            : "No icon set: the site shows the </> fallback."}
      </p>

      {picking && (
        <div
          id={`${id}-picker`}
          role="group"
          aria-label="Available icons"
          className="mt-2 grid max-h-56 grid-cols-3 gap-1 overflow-y-auto rounded border border-border bg-void p-2 sm:grid-cols-4"
        >
          {matches.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                onChange(n);
                setPicking(false);
              }}
              aria-pressed={n === name}
              title={n}
              className={`flex min-w-0 items-center gap-2 rounded px-2 py-1.5 text-left font-mono text-[11px] hover:bg-white/5 ${
                n === name ? "bg-accent/10 text-accent" : "text-gray-300"
              }`}
            >
              <DynamicIcon name={n} className="h-4 w-4 shrink-0" />
              <span className="truncate">{n}</span>
            </button>
          ))}
          {matches.length === 0 && (
            <p className="col-span-full px-2 py-1 font-mono text-xs text-gray-500">
              No icon matches &quot;{name}&quot;. Clear the field to see them all.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
