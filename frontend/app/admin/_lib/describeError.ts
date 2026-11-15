// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import { ApiError } from "@/lib/api/http";

/** Turns a failed admin request into a message that says what to do next. */
export function describeError(e: unknown): string {
  if (!(e instanceof ApiError))
    return "Request failed. Check your connection, or the server may be waking up — try again in a minute.";
  const detail = e.details.length ? ` ${e.details.join(" · ")}` : "";
  switch (e.status) {
    case 400:
      return `Some fields aren't valid:${detail || " check the form and try again."}`;
    case 401:
      return "Your session expired. Log out and back in.";
    case 403:
      return "Access denied. Log out and back in with your authenticator code.";
    case 404:
      return "That entry no longer exists. The list has been refreshed.";
    case 429:
      return "Too many requests. Wait a minute and try again.";
    default:
      // 500 is usually a database rule, e.g. a duplicate project slug.
      return `The server couldn't save this (error ${e.status}). Check for a duplicate slug or a missing required field.${detail}`;
  }
}
