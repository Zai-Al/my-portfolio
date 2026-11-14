// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import { revalidateTag } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { CONTENT_TAG } from "@/lib/api/public";

/**
 * POST /api/revalidate - called by the admin portal after a save, so the public pages
 * show the change right away instead of after the hourly cache refresh.
 * Only a signed-in Supabase user may trigger it (sign-ups are off, so that's the admin);
 * it changes no data, it only drops the cached pages.
 */
export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) return Response.json({ error: "missing token" }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  );
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return Response.json({ error: "invalid token" }, { status: 401 });

  // expire: 0 = drop the cached pages now, so the next visit shows the edit (Next 16 API).
  revalidateTag(CONTENT_TAG, { expire: 0 });
  return Response.json({ revalidated: true });
}
