// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useCallback, useRef, useState } from "react";
import Modal from "./Modal";

export type ConfirmOptions = {
  title: string;
  message?: React.ReactNode;
  /** Text on the confirm button, e.g. "delete". */
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button, for things that can't be undone. */
  danger?: boolean;
};

/** A yes/no question in the site's own modal (instead of the browser's confirm()). */
export default function ConfirmDialog({
  open,
  options,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  options: ConfirmOptions;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { title, message, confirmLabel = "ok", cancelLabel = "cancel", danger = false } = options;
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      {message && <div className="text-sm text-gray-300">{message}</div>}
      <div className="mt-6 flex justify-end gap-2">
        {/* Cancel gets focus first, so Enter never deletes by accident. */}
        <button
          data-autofocus
          onClick={onCancel}
          className="rounded border border-border px-4 py-1.5 font-mono text-sm text-gray-300 hover:bg-white/5"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          className={`rounded border px-4 py-1.5 font-mono text-sm ${
            danger
              ? "border-red-500/60 text-red-400 hover:bg-red-500/10"
              : "border-accent text-accent hover:bg-accent/10"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

/**
 * `const [confirm, confirmDialog] = useConfirm();` then render `{confirmDialog}` and
 * `if (!(await confirm({ title: "Delete X?", danger: true }))) return;`
 * Esc, the backdrop and ✕ all count as "cancel".
 */
export function useConfirm() {
  const [open, setOpen] = useState(false);
  // Kept after closing so the text doesn't vanish during the closing animation.
  const [options, setOptions] = useState<ConfirmOptions>({ title: "" });
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const confirm = useCallback((next: ConfirmOptions) => {
    resolver.current?.(false); // a newer question replaces an unanswered one
    setOptions(next);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const answer = (ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setOpen(false);
  };

  const dialog = (
    <ConfirmDialog
      open={open}
      options={options}
      onConfirm={() => answer(true)}
      onCancel={() => answer(false)}
    />
  );

  return [confirm, dialog] as const;
}
