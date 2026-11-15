// Copyright (c) 2026 Zainab Alawi. All rights reserved.

// The Supabase Realtime channel that announces content changes (see lib/liveUpdates.ts).
// Kept apart from the React hook so the /api/revalidate route can import it on the server.
// The topic name must match the RLS policies on realtime.messages.

export const CONTENT_CHANNEL = "content";
export const CONTENT_CHANGED_EVENT = "changed";
