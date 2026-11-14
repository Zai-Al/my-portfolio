// Copyright (c) 2026 Zainab Alawi. All rights reserved.

// The one place that talks HTTP to the ASP.NET API. Everything else goes through
// lib/api/public.ts (visitor pages) or lib/api/admin.ts (admin portal).

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5080";

/** A non-2xx response. `details` holds readable validation messages when the API sent any. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public details: string[],
    message: string
  ) {
    super(message);
  }
}

// ASP.NET Core returns validation failures as ProblemDetails:
// { title, errors: { Field: ["message", ...] } }. Pull out readable lines.
async function readErrorDetails(res: Response): Promise<string[]> {
  try {
    const body = await res.json();
    if (body?.errors && typeof body.errors === "object") {
      return Object.entries(body.errors as Record<string, string[]>).flatMap(([field, msgs]) =>
        msgs.map((m) => (field && !m.includes(field) ? `${field}: ${m}` : m))
      );
    }
    if (typeof body?.title === "string") return [body.title];
  } catch {
    // empty or non-JSON body
  }
  return [];
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Supabase access token, for admin-only endpoints. */
  token?: string;
  body?: unknown;
  /** Extra fetch options, e.g. Next.js caching. */
  init?: RequestInit;
};

/** Calls the API and returns the parsed JSON (or undefined for empty replies). Throws ApiError on failure. */
export async function request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", token, body, init } = options;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new ApiError(
      res.status,
      await readErrorDetails(res),
      `${method} ${path} failed: ${res.status}`
    );
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/**
 * Pings GET /health once. "ok" = API and database up; "degraded" = the API answered but
 * reported a problem (usually the database); "unreachable" = no answer in time (a sleeping
 * Render instance holds the request while it starts, so a long wait is normal).
 */
export async function checkHealth(timeoutMs = 20_000): Promise<"ok" | "degraded" | "unreachable"> {
  try {
    const res = await fetch(`${API_URL}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    return res.ok ? "ok" : "degraded";
  } catch {
    return "unreachable";
  }
}
