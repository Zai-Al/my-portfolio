// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useState } from "react";
import { FaLanguage } from "react-icons/fa";
import { translateToArabic } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/http";
import type { FieldConfig } from "../_lib/fields";
import { asArabicFields, textsToTranslate } from "../_lib/translate";

/**
 * Fills the form's empty Arabic boxes with a Gemini translation of the English ones (free
 * tier, the AI guide's key). Nothing is saved until "save", so the Arabic can be checked and
 * corrected first. To re-translate a box, empty it and press the button again.
 */
export default function TranslateButton<T>({
  token,
  fields,
  values,
  onTranslated,
}: {
  token: string;
  fields: FieldConfig<T>[];
  values: Partial<T>;
  /** Receives the Arabic values to merge into the form, e.g. { roleAr: "…" }. */
  onTranslated: (patch: Partial<T>) => void;
}) {
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const pending = textsToTranslate(fields, values);
  const count = Object.keys(pending).length;

  async function translate() {
    setStatus("working");
    setMessage("");
    try {
      const { fields: translated } = await translateToArabic(token, pending);
      onTranslated(asArabicFields(translated) as Partial<T>);
      const missed = count - Object.keys(translated).length;
      setStatus("done");
      setMessage(
        missed > 0
          ? `translated ${count - missed}, ${missed} left empty: check them, then save`
          : "translated: check the Arabic, then save"
      );
    } catch (e) {
      setStatus("error");
      setMessage(
        e instanceof ApiError && e.status === 429
          ? "Too many translations in a row. Wait a few minutes."
          : e instanceof ApiError && e.details[0]
            ? e.details[0]
            : "The translation failed. Try again."
      );
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={translate}
        disabled={status === "working" || count === 0}
        title={
          count === 0
            ? "Every Arabic box with English next to it is filled in. Empty one to re-translate it."
            : "Fill the empty Arabic boxes with an AI translation (not saved until you press save)"
        }
        className="inline-flex items-center gap-2 rounded border border-aurora-purple/60 px-3 py-1.5 font-mono text-sm text-aurora-purple hover:bg-aurora-purple/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <FaLanguage aria-hidden="true" />
        {status === "working"
          ? "translating…"
          : count > 0
            ? `translate to Arabic (${count})`
            : "Arabic filled in"}
      </button>
      {message && (
        <span
          role="status"
          className={`font-mono text-xs ${status === "error" ? "text-red-400" : "text-gray-400"}`}
        >
          {message}
        </span>
      )}
    </div>
  );
}
