// Copyright (c) 2026 Zainab Alawi. All rights reserved.

// --- Field config used to render generic create/edit forms ---
// list  = comma separated  -> string[]
// lines = one item per line -> string[] (for bullets, highlights, URLs)
// select = dropdown of numeric options (e.g. a skill's category)
// icon  = react-icons name, with a live preview and a picker
// file  = one URL, with an upload button and preview (CV, photo, certificate image)
// files = list of URLs, with multi-upload, thumbnails and ordering (screenshots)
export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "list"
  | "lines"
  | "bool"
  | "select"
  | "icon"
  | "file"
  | "files";
export type SelectOption = { value: number; label: string };
export type FieldConfig<T> = {
  key: keyof T;
  label: string;
  type: FieldType;
  options?: SelectOption[];
  /** file/files: Storage folder for uploads, from the values in the form (e.g. the slug). */
  folder?: (values: Partial<T>) => string;
  /** file/files: allowed file types for the picker, e.g. "application/pdf". */
  accept?: string;
};

export function emptyValue(type: FieldType, options?: SelectOption[]): unknown {
  if (type === "select") return options?.[0]?.value ?? 0;
  if (type === "list" || type === "lines" || type === "files") return [];
  if (type === "number") return 0;
  if (type === "bool") return false;
  return "";
}

export function emptyFromFields<T>(fields: FieldConfig<T>[]): Partial<T> {
  const obj: Partial<T> = {};
  for (const f of fields) {
    (obj as Record<string, unknown>)[f.key as string] = emptyValue(f.type, f.options);
  }
  return obj;
}

export function parseField(type: FieldType, raw: string | boolean): unknown {
  if (type === "bool") return Boolean(raw);
  const text = String(raw);
  if (type === "number" || type === "select") return Number.isNaN(Number(text)) ? 0 : Number(text);
  if (type === "list")
    return text
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  if (type === "lines" || type === "files")
    return text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  return text;
}

export function stripUndefined<T>(obj?: Partial<T>): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj ?? {}).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

export function displayField(type: FieldType, raw: unknown): string {
  if (Array.isArray(raw)) return raw.join(type === "list" ? ", " : "\n");
  return raw == null ? "" : String(raw);
}
