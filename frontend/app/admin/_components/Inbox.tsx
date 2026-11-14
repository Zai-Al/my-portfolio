// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useConfirm } from "@/components/ui/ConfirmDialog";
import { adminDelete, adminPatch } from "@/lib/api/admin";
import type { ContactMessage } from "@/lib/types";

/** Contact-form messages: mark read/unread, delete. */
export default function Inbox({
  token,
  messages,
  onChanged,
  onError,
}: {
  token: string;
  messages: ContactMessage[];
  onChanged: () => void;
  onError: (e: unknown) => void;
}) {
  const [confirm, confirmDialog] = useConfirm();

  async function toggleRead(m: ContactMessage) {
    try {
      await adminPatch(`/api/contact/${m.id}`, token, { read: !m.read });
      onChanged();
    } catch (e) {
      onError(e);
    }
  }

  async function deleteMessage(m: ContactMessage) {
    const ok = await confirm({
      title: `Delete the message from ${m.name}?`,
      message: "This can't be undone.",
      confirmLabel: "delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await adminDelete(`/api/contact/${m.id}`, token);
      onChanged();
    } catch (e) {
      onError(e);
    }
  }

  // Opens the mail app with the visitor's address, "Re: subject" and their message quoted.
  function replyLink(m: ContactMessage) {
    const subject = `Re: ${m.subject || "your message on my portfolio"}`;
    const quoted = m.message
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n");
    const body = `\n\n${m.name} wrote on ${new Date(m.receivedAt).toLocaleString()}:\n${quoted}`;
    return `mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <section>
      <ul className="space-y-2">
        {messages.map((m) => (
          <li
            key={m.id}
            className={`rounded border p-3 font-mono text-sm ${
              m.read ? "border-border text-gray-500" : "border-accent/40 text-gray-200"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="break-words">
                  {!m.read && <span className="mr-2 text-accent">●</span>}
                  {m.name} &lt;{m.email}&gt;{" "}
                  <span className="text-xs text-gray-500">
                    {new Date(m.receivedAt).toLocaleString()}
                  </span>
                </p>
                {m.subject && <p className="mt-1 font-semibold text-gray-200">{m.subject}</p>}
                <p className="mt-1 whitespace-pre-wrap break-words text-gray-300">{m.message}</p>
              </div>
              <span className="flex shrink-0 flex-col gap-2">
                <a
                  href={replyLink(m)}
                  onClick={() => !m.read && toggleRead(m)}
                  className="rounded border border-accent/50 px-2 py-1 text-center text-xs text-accent hover:bg-accent/10"
                >
                  reply
                </a>
                <button
                  onClick={() => toggleRead(m)}
                  className="rounded border border-border px-2 py-1 text-xs text-gray-300 hover:bg-white/5"
                >
                  {m.read ? "mark unread" : "mark read"}
                </button>
                <button
                  onClick={() => deleteMessage(m)}
                  className="rounded border border-red-500/40 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10"
                >
                  delete
                </button>
              </span>
            </div>
          </li>
        ))}
        {messages.length === 0 && (
          <li className="font-mono text-sm text-gray-500">no messages yet</li>
        )}
      </ul>
      {confirmDialog}
    </section>
  );
}
