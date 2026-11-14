// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import { FaRegCopyright } from "react-icons/fa";

export default function Footer({ name }: { name: string | null }) {
  return (
    <footer className="relative mx-auto flex max-w-4xl items-center justify-center gap-2 px-6 pb-24 pt-8 font-mono md:pb-8 text-xs text-gray-400">
      <FaRegCopyright className="text-gray-400" aria-hidden="true" />
      <span>
        {new Date().getFullYear()}
        {name ? ` ${name}` : ""}. All rights reserved.
      </span>
    </footer>
  );
}
