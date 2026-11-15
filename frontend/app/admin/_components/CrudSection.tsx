// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { Fragment, useState } from "react";
import { adminCreate, adminDelete, adminReorder, adminUpdate } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/http";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { describeError } from "../_lib/describeError";
import {
  emptyFromFields,
  parseField,
  stripUndefined,
  type FieldConfig,
  type FieldType,
} from "../_lib/fields";
import { useListSearch } from "../_hooks/useListSearch";
import type { SearchConfig } from "../_lib/search";
import { FilterChips, SearchPanel, SearchToggle } from "./SearchPanel";
import EditPanel from "./EditPanel";
import FieldInput from "./FieldInput";

type Ordered = { id: number; sortOrder: number };

/** A list's identity + order; changes whenever fresh data with a new order arrives. */
const signature = (items: Ordered[]) => items.map((i) => `${i.id}:${i.sortOrder}`).join(",");

/**
 * List + add/edit/delete/reorder for one content table, driven by a field list.
 * Add and edit open a side panel; ↑/↓ change the order (SortOrder) without typing numbers.
 */
export default function CrudSection<T extends Ordered>({
  title,
  token,
  items,
  basePath,
  fields,
  renderLabel,
  onChanged,
  onError,
  defaults,
  groupOf,
  confirmDelete,
  search,
}: {
  title: string;
  token: string;
  items: T[];
  basePath: string;
  fields: FieldConfig<T>[];
  renderLabel: (item: T) => string;
  onChanged: () => void;
  onError: (e: unknown) => void;
  /** Pre-filled values for "+ add" (e.g. the category currently filtered on). */
  defaults?: Partial<T>;
  /** When set, a small heading is shown each time the group changes, and ↑/↓ stay inside a group. */
  groupOf?: (item: T) => string;
  /** Extra text in the delete dialog (default: "This can't be undone."). */
  confirmDelete?: (item: T) => string;
  /** Adds a 🔍 search (and filter chips) to this list. */
  search?: SearchConfig<T>;
}) {
  const [form, setForm] = useState<Partial<T> | null>(null);
  const [initial, setInitial] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [panelError, setPanelError] = useState("");
  const [confirm, confirmDialog] = useConfirm();

  // A move shows straight away; it's dropped once the reloaded list (with the new order) arrives.
  const [pending, setPending] = useState<{ base: string; ids: number[] } | null>(null);
  const [moving, setMoving] = useState(false);
  const base = signature(items);
  const shown =
    pending && pending.base === base
      ? pending.ids.map((id) => items.find((i) => i.id === id)).filter((i): i is T => !!i)
      : items;

  const editing = editingId !== null ? items.find((i) => i.id === editingId) : undefined;

  // While searching, only matches are listed and reordering is off (moves need the full list).
  const listSearch = useListSearch(shown, search);
  const { filtered, searching } = listSearch;

  function open(next: Partial<T>, id: number | null) {
    setEditingId(id);
    setForm(next);
    setInitial(JSON.stringify(next));
    setPanelError("");
  }

  const startCreate = () =>
    open({ ...emptyFromFields(fields), ...stripUndefined(defaults) } as Partial<T>, null);
  const startEdit = (item: T) => open({ ...item }, item.id);

  function close() {
    setForm(null);
    setEditingId(null);
  }

  async function requestClose() {
    if (saving) return;
    const dirty = form !== null && JSON.stringify(form) !== initial;
    if (
      dirty &&
      !(await confirm({
        title: "Discard your changes?",
        message: "What you changed in this form hasn't been saved and will be lost.",
        confirmLabel: "discard",
        cancelLabel: "keep editing",
        danger: true,
      }))
    )
      return;
    close();
  }

  function setField(key: keyof T, type: FieldType, raw: string | boolean) {
    setForm((f) => (f ? { ...f, [key]: parseField(type, raw) } : f));
  }

  async function save() {
    if (!form) return;
    setSaving(true);
    setPanelError("");
    try {
      if (editingId !== null) {
        await adminUpdate(`${basePath}/${editingId}`, token, form);
      } else {
        // New entries go to the end of the list.
        const last = Math.max(-1, ...items.map((i) => i.sortOrder));
        await adminCreate(basePath, token, { ...form, sortOrder: last + 1 });
      }
      close();
      onChanged();
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        // Deleted somewhere else: nothing left to edit, so reload the list.
        close();
        onError(e);
      } else if (e instanceof ApiError && e.status === 409) {
        // Same record as an existing entry: say which one in a popup, keep the form open.
        await confirm({
          title: "This entry already exists",
          message: describeError(e),
          confirmLabel: "back to the form",
          hideCancel: true,
        });
      } else {
        // Shown inside the panel so the form (and what was typed) stays open.
        setPanelError(describeError(e));
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove(item: T) {
    const ok = await confirm({
      title: `Delete "${renderLabel(item)}"?`,
      message: confirmDelete ? confirmDelete(item) : "This can't be undone.",
      confirmLabel: "delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await adminDelete(`${basePath}/${item.id}`, token);
      onChanged();
    } catch (e) {
      onError(e);
    }
  }

  const sameGroup = (a: T, b: T) => !groupOf || groupOf(a) === groupOf(b);
  const canMove = (i: number, dir: -1 | 1) => {
    if (searching) return false;
    const j = i + dir;
    return j >= 0 && j < shown.length && sameGroup(shown[i], shown[j]);
  };

  async function move(i: number, dir: -1 | 1) {
    if (!canMove(i, dir) || moving) return;
    const next = [...shown];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    // Renumber only the moved item's group (e.g. one skill category), in its new order.
    const ids = next.filter((x) => sameGroup(x, shown[i])).map((x) => x.id);
    setPending({ base, ids: next.map((x) => x.id) });
    setMoving(true);
    try {
      await adminReorder(basePath, token, ids);
      onChanged();
    } catch (e) {
      setPending(null);
      onError(e);
    } finally {
      setMoving(false);
    }
  }

  const iconButton =
    "rounded border border-border px-2 py-1 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold">{title}</h2>
        <div className="flex items-center gap-2">
          <SearchToggle search={listSearch} />
          <button
            onClick={startCreate}
            className="rounded border border-accent px-3 py-1 font-mono text-xs text-accent hover:bg-accent/10"
          >
            + add
          </button>
        </div>
      </div>
      <FilterChips search={listSearch} />
      <SearchPanel search={listSearch} />
      {searching && (
        <p className="mt-2 font-mono text-xs text-gray-500">
          Showing matches only. Clear the search to reorder.
        </p>
      )}

      <ul className="mt-3 space-y-2">
        {filtered.map((item, i) => {
          const group = groupOf?.(item);
          const showGroup =
            group !== undefined && (i === 0 || groupOf?.(filtered[i - 1]) !== group);
          const label = renderLabel(item);
          return (
            <Fragment key={item.id}>
              {showGroup && (
                <li className="pt-3 font-mono text-xs uppercase tracking-wider text-accent/80 first:pt-0">
                  {group}
                </li>
              )}
              <li
                className={`flex items-center justify-between gap-3 rounded border bg-panel/40 px-3 py-2 font-mono text-sm text-gray-300 ${
                  item.id === editingId ? "border-accent/60" : "border-border"
                }`}
              >
                <span className="min-w-0 truncate">{label}</span>
                <span className="flex shrink-0 gap-2 text-xs">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={!canMove(i, -1) || moving}
                    aria-label={`Move "${label}" up`}
                    title={searching ? "Clear the search to reorder" : "Move up"}
                    className={iconButton}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={!canMove(i, 1) || moving}
                    aria-label={`Move "${label}" down`}
                    title={searching ? "Clear the search to reorder" : "Move down"}
                    className={iconButton}
                  >
                    ↓
                  </button>
                  <button onClick={() => startEdit(item)} className={iconButton}>
                    edit
                  </button>
                  <button
                    onClick={() => remove(item)}
                    className="rounded border border-red-500/40 px-2 py-1 text-red-400 hover:bg-red-500/10"
                  >
                    delete
                  </button>
                </span>
              </li>
            </Fragment>
          );
        })}
        {items.length === 0 && <li className="font-mono text-sm text-gray-500">none yet</li>}
        {items.length > 0 && filtered.length === 0 && (
          <li className="font-mono text-sm text-gray-500">no matches</li>
        )}
      </ul>

      <EditPanel
        open={form !== null}
        subtitle={`${title} · ${editingId !== null ? "edit" : "new"}`}
        title={editing ? renderLabel(editing) : "New entry"}
        onClose={requestClose}
        footer={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="rounded border border-accent px-4 py-1.5 font-mono text-sm text-accent hover:bg-accent/10 disabled:opacity-50"
            >
              {saving ? "saving..." : "save"}
            </button>
            <button
              onClick={requestClose}
              disabled={saving}
              className="rounded border border-border px-4 py-1.5 font-mono text-sm text-gray-300 hover:bg-white/5 disabled:opacity-50"
            >
              cancel
            </button>
          </div>
        }
      >
        {panelError && (
          <p
            role="alert"
            className="mb-4 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 font-mono text-sm text-red-400"
          >
            {panelError}
          </p>
        )}
        {form && (
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((f) => (
              <FieldInput
                key={f.key as string}
                field={f}
                value={(form as Record<string, unknown>)[f.key as string]}
                wide={f.type === "textarea" || f.type === "lines"}
                folder={f.folder?.(form)}
                onChange={(raw) => setField(f.key, f.type, raw)}
              />
            ))}
          </div>
        )}
      </EditPanel>
      {confirmDialog}
    </section>
  );
}
