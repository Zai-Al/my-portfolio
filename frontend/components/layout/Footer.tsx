// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import { FaRegCopyright } from "react-icons/fa";
import { useTranslations } from "next-intl";

export default function Footer({ name }: { name: string | null }) {
  const t = useTranslations("common");
  return (
    <footer className="relative mx-auto flex max-w-4xl items-center justify-center gap-2 px-6 pb-24 pt-8 font-mono md:pb-8 text-xs text-gray-400">
      <FaRegCopyright className="text-gray-400" aria-hidden="true" />
      <span>{t("rights", { year: new Date().getFullYear(), name: name ? ` ${name}` : "" })}</span>
    </footer>
  );
}
