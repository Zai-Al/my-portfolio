// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import { useCallback, useState } from "react";
import { ADMIN_PAGES, type AdminPageId } from "../_lib/adminPages";

const isAdminPage = (v: string): v is AdminPageId => ADMIN_PAGES.some((p) => p.id === v);

/** Current page, kept in the URL hash (#skills) so a refresh stays on the same page. */
export function useAdminPage(): [AdminPageId, (p: AdminPageId) => void] {
  // The dashboard only renders in the browser (after login), so the hash can be read directly.
  const [page, setPageState] = useState<AdminPageId>(() => {
    const fromHash = typeof window === "undefined" ? "" : window.location.hash.slice(1);
    return isAdminPage(fromHash) ? fromHash : "profile";
  });
  const setPage = useCallback((p: AdminPageId) => {
    setPageState(p);
    window.history.replaceState(null, "", `#${p}`);
    window.scrollTo({ top: 0 });
  }, []);
  return [page, setPage];
}
