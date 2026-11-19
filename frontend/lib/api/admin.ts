// Copyright (c) 2026 Zainab Alawi. All rights reserved.

// Admin-only calls. Each needs the Supabase access token (password + authenticator code);
// the API rejects anything else with 401/403. All of them throw ApiError on failure.

import type { ContactMessage, SiteSettings } from "@/lib/types";
import { request } from "./http";

/** Reads any list or record (public endpoints, but the admin wants errors, not fallbacks). */
export const adminGet = <T>(path: string) => request<T>(path, { init: { cache: "no-store" } });

export const adminCreate = (path: string, token: string, body: unknown) =>
  request(path, { method: "POST", token, body });
export const adminUpdate = (path: string, token: string, body: unknown) =>
  request(path, { method: "PUT", token, body });
export const adminPatch = (path: string, token: string, body: unknown) =>
  request(path, { method: "PATCH", token, body });
export const adminDelete = (path: string, token: string) =>
  request(path, { method: "DELETE", token });
/** Saves a new display order: SortOrder becomes each id's position in the list. */
export const adminReorder = (basePath: string, token: string, ids: number[]) =>
  request(`${basePath}/order`, { method: "PUT", token, body: ids });

export const getMessages = (token: string) =>
  request<ContactMessage[]>("/api/contact", { token, init: { cache: "no-store" } });

/** The full settings, email and phone included (the public read leaves them out). */
export const getFullSiteSettings = (token: string) =>
  request<SiteSettings>("/api/site-settings/full", { token, init: { cache: "no-store" } });

export const saveSiteSettings = (token: string, settings: SiteSettings) =>
  adminUpdate("/api/site-settings", token, { ...settings, id: 1 });

/** The AI guide's knowledge (GET /api/knowledge/status). */
export type KnowledgeStatus = {
  state: "idle" | "queued" | "running";
  lastStartedAt: string | null;
  lastFinishedAt: string | null;
  lastMessage: string | null;
  chunks: number;
  embedded: number;
};

export const getKnowledgeStatus = (token: string) =>
  request<KnowledgeStatus>("/api/knowledge/status", { token, init: { cache: "no-store" } });

/** Queues a rebuild; it runs in the background on the API. */
export const rebuildKnowledge = (token: string) =>
  request("/api/knowledge/reindex", { method: "POST", token });

/**
 * "Translate to Arabic": English texts by field name in, Arabic by field name out
 * (POST /api/translate, Gemini). Nothing is saved; the form shows the result for review.
 */
export const translateToArabic = (token: string, fields: Record<string, string | string[]>) =>
  request<{ fields: Record<string, string | string[]> }>("/api/translate", {
    method: "POST",
    token,
    body: { fields },
  });
