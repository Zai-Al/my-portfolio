// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useState } from "react";
import { saveSiteSettings } from "@/lib/api/admin";
import type { SiteSettings } from "@/lib/types";
import { parseField } from "../_lib/fields";
import { SETTINGS_FIELDS } from "../_lib/formConfig";
import FieldInput from "./FieldInput";
import TranslateButton from "./TranslateButton";

/** The single SiteSettings row: hero, about, contact links, CV and photo. */
export default function ProfileForm({
  token,
  settings,
  onChange,
  onSaved,
  onError,
}: {
  token: string;
  settings: SiteSettings;
  onChange: (update: (s: SiteSettings) => SiteSettings) => void;
  /** Called after a successful save (refreshes the public site). */
  onSaved: () => void;
  onError: (e: unknown) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await saveSiteSettings(token, settings);
      setSaved(true);
      onSaved();
    } catch (e) {
      onError(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <div className="grid gap-3 sm:grid-cols-2">
        {SETTINGS_FIELDS.map((f) => (
          <FieldInput
            key={f.key as string}
            field={f}
            value={settings[f.key]}
            wide={f.type === "textarea"}
            folder={f.folder?.(settings)}
            onChange={(raw) => {
              onChange((s) => ({ ...s, [f.key]: parseField(f.type, raw) }));
              setSaved(false);
            }}
          />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="rounded border border-accent px-4 py-1.5 font-mono text-sm text-accent hover:bg-accent/10 disabled:opacity-50"
        >
          {saving ? "saving..." : saved ? "saved" : "save"}
        </button>
        <TranslateButton
          token={token}
          fields={SETTINGS_FIELDS}
          values={settings}
          onTranslated={(patch) => {
            onChange((s) => ({ ...s, ...patch }));
            setSaved(false);
          }}
        />
      </div>
    </section>
  );
}
