// Copyright (c) 2026 Zainab Alawi. All rights reserved.

// Calls a visitor's browser makes (contact form; the AI guide is in ask.ts). Kept apart from public.ts,
// which uses Next.js server caching that shouldn't be shipped to the browser.
// Both throw ApiError so the UI can explain what happened.

import { request } from "./http";

export type ContactRequest = {
  name: string;
  email: string;
  subject?: string;
  message: string;
  website?: string; // honeypot - must stay empty for real visitors
};

/**
 * The email address, for a browser that passed Cloudflare Turnstile ("Show email").
 * Throws ApiError (403 = spam check failed, 429 = rate limited).
 */
export const revealEmail = (token: string) =>
  request<{ email: string }>("/api/site-settings/email", {
    method: "POST",
    body: { token },
    init: { cache: "no-store" },
  });

/** Sends the contact form. Throws ApiError (429 = rate limited). */
export const postContact = (body: ContactRequest) =>
  request("/api/contact", { method: "POST", body });
