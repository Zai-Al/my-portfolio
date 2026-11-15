// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import { revalidateTag } from "next/cache";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { CONTENT_TAG } from "@/lib/api/public";
import { CONTENT_CHANGED_EVENT, CONTENT_CHANNEL } from "@/lib/liveChannel";

/**
 * POST /api/revalidate - called by the admin portal after a save, so the public pages
 * show the change right away instead of after the hourly cache refresh.
 * Only a signed-in Supabase user may trigger it (sign-ups are off, so that's the admin);
 * it changes no data, it only drops the cached pages and tells open pages to reload.
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
  // Only after the cache is cleared, so pages that reload on this message get the new data.
  const live = await announceChange(supabase, token);
  return Response.json({ revalidated: true, live });
}

/**
 * Sends "changed" on the private Realtime channel, as the admin: the RLS policy on
 * realtime.messages lets only the admin email with two-factor (aal2) send. A failure is
 * logged, not returned as an error: the cache is cleared either way, and pages catch up
 * on their next load.
 */
async function announceChange(supabase: SupabaseClient, token: string): Promise<boolean> {
  await supabase.realtime.setAuth(token);
  const channel = supabase.channel(CONTENT_CHANNEL, { config: { private: true } });
  try {
    const result = await channel.httpSend(CONTENT_CHANGED_EVENT, { at: new Date().toISOString() });
    if (!result.success) console.warn(`live update not sent: ${result.status} ${result.error}`);
    return result.success;
  } catch (e) {
    console.warn("live update not sent:", e);
    return false;
  } finally {
    await supabase.removeChannel(channel);
  }
}
