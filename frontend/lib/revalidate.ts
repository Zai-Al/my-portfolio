// Copyright (c) 2026 Zainab Alawi. All rights reserved.

/**
 * Tells the site to drop its cached pages so an admin edit shows up right away.
 * Resolves to false when that didn't happen (e.g. the login session has ended) so the
 * admin can say so; the cache still refreshes on its own within the hour.
 */
export async function refreshPublicPages(token: string): Promise<boolean> {
  try {
    const res = await fetch("/api/revalidate", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}
