// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useEffect, useRef } from "react";
import { FaExternalLinkAlt, FaSignOutAlt } from "react-icons/fa";
import { ADMIN_PAGES, type AdminPageId } from "../_lib/adminPages";

export default function AdminNav({
  page,
  onSelect,
  unread,
  onLogout,
}: {
  page: AdminPageId;
  onSelect: (p: AdminPageId) => void;
  unread: number;
  onLogout: () => void;
}) {
  const activeRef = useRef<HTMLButtonElement>(null);
  // On phones the menu scrolls sideways: keep the current page's tab in view.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [page]);

  return (
    <aside className="sticky top-0 z-10 shrink-0 border-b border-border bg-panel/70 backdrop-blur-md md:h-screen md:w-60 md:border-b-0 md:border-r">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-4 py-3 md:block md:px-5 md:py-6">
          <p className="font-display text-lg font-bold">
            admin<span className="text-accent">_</span>
          </p>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 rounded border border-border px-2 py-1 font-mono text-xs text-gray-300 hover:bg-white/5 md:hidden"
          >
            <FaSignOutAlt aria-hidden="true" /> log out
          </button>
        </div>

        {/* Horizontal scroller on phones, vertical list from md up */}
        <nav
          aria-label="Admin sections"
          className="overflow-x-auto px-2 pb-2 md:flex-1 md:overflow-visible md:px-3"
        >
          <ul className="flex gap-1 md:flex-col">
            {ADMIN_PAGES.map(({ id, label, Icon }) => {
              const active = id === page;
              return (
                <li key={id} className="shrink-0">
                  <button
                    ref={active ? activeRef : undefined}
                    onClick={() => onSelect(id)}
                    aria-current={active ? "page" : undefined}
                    className={`flex w-full items-center gap-3 whitespace-nowrap rounded-md px-3 py-2 text-left font-mono text-sm transition-colors ${
                      active
                        ? "bg-accent/10 text-accent"
                        : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                    }`}
                  >
                    <Icon aria-hidden="true" className="shrink-0" />
                    <span className="flex-1">{label}</span>
                    {id === "inbox" && unread > 0 && (
                      <span
                        className="rounded-full bg-accent px-1.5 text-xs font-semibold text-void"
                        aria-label={`${unread} unread`}
                      >
                        {unread}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden space-y-2 px-3 py-5 md:block">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-md px-3 py-2 font-mono text-sm text-gray-400 hover:bg-white/5 hover:text-gray-200"
          >
            <FaExternalLinkAlt aria-hidden="true" /> view site
          </a>
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 font-mono text-sm text-gray-400 hover:bg-white/5 hover:text-gray-200"
          >
            <FaSignOutAlt aria-hidden="true" /> log out
          </button>
        </div>
      </div>
    </aside>
  );
}
