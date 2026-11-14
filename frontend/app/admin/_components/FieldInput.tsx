// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useState } from "react";
import { displayField, parseField, type FieldConfig } from "../_lib/fields";
import IconFieldInput from "./IconFieldInput";
import { MediaFieldInput, MediaListInput } from "./MediaFieldInput";

export default function FieldInput<T>({
  field,
  value,
  onChange,
  wide = false,
  folder = "misc",
}: {
  field: FieldConfig<T>;
  value: unknown;
  onChange: (raw: string | boolean) => void;
  wide?: boolean;
  /** Storage folder for file/files uploads. */
  folder?: string;
}) {
  if (field.type === "bool") {
    return (
      <label className="flex items-center gap-2 font-mono text-xs text-gray-400">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
        {field.label}
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <div className={wide ? "sm:col-span-2" : undefined}>
        <label className="font-mono text-xs text-gray-400">
          {field.label}
          <select
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            className="mt-1 block w-full rounded border border-border bg-void px-2 py-1.5 font-mono text-sm text-white outline-none focus:border-accent"
          >
            {(field.options ?? []).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    );
  }

  if (field.type === "file") {
    return (
      <MediaFieldInput
        label={field.label}
        value={String(value ?? "")}
        folder={folder}
        accept={field.accept}
        onChange={onChange}
      />
    );
  }

  if (field.type === "files") {
    return (
      <MediaListInput
        label={field.label}
        value={Array.isArray(value) ? (value as string[]) : []}
        folder={folder}
        accept={field.accept}
        onChange={(urls) => onChange(urls.join("\n"))}
      />
    );
  }

  if (field.type === "icon") {
    return <IconFieldInput label={field.label} value={String(value ?? "")} onChange={onChange} />;
  }

  return <TextFieldInput field={field} value={value} onChange={onChange} wide={wide} />;
}

// Keeps the raw text while typing so list fields don't swallow a trailing
// comma or newline; the parsed value is pushed up on every change.
function TextFieldInput<T>({
  field,
  value,
  onChange,
  wide,
}: {
  field: FieldConfig<T>;
  value: unknown;
  onChange: (raw: string) => void;
  wide: boolean;
}) {
  const inputClass =
    "mt-1 w-full rounded border border-border bg-void px-2 py-1.5 font-mono text-sm text-white outline-none";
  const external = displayField(field.type, value);
  const [text, setText] = useState(external);

  // Re-sync when the value changes from outside (e.g. data finished loading), but keep the
  // raw text (e.g. a trailing comma) if it already means the same value. Done during render,
  // React's recommended way to adjust state when a prop changes.
  const [lastExternal, setLastExternal] = useState(external);
  if (external !== lastExternal) {
    setLastExternal(external);
    if (displayField(field.type, parseField(field.type, text)) !== external) setText(external);
  }

  function handle(raw: string) {
    setText(raw);
    onChange(raw);
  }

  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <label className="font-mono text-xs text-gray-400">{field.label}</label>
      {field.type === "textarea" || field.type === "lines" ? (
        <textarea
          value={text}
          onChange={(e) => handle(e.target.value)}
          rows={field.type === "lines" ? 4 : 3}
          className={inputClass}
        />
      ) : (
        <input
          type={field.type === "number" ? "number" : "text"}
          value={text}
          onChange={(e) => handle(e.target.value)}
          className={inputClass}
        />
      )}
    </div>
  );
}
