// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AuthCard, authInputClass } from "./AuthCard";

/** `notice` explains why you were sent back here (e.g. the session ended). */
export default function LoginForm({ notice }: { notice?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (signInError) setError(signInError.message);
  }

  return (
    <AuthCard title="Admin login" onSubmit={login}>
      {notice && (
        <p
          role="status"
          className="mt-3 rounded border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-sm text-amber-300"
        >
          {notice}
        </p>
      )}
      <input
        type="email"
        autoComplete="username"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email"
        aria-label="Email"
        className={authInputClass}
      />
      <input
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="password"
        aria-label="Password"
        className={authInputClass}
      />
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      <button
        disabled={busy}
        className="mt-4 w-full rounded bg-accent py-2 font-mono text-sm text-void disabled:opacity-50"
      >
        {busy ? "logging in..." : "log in"}
      </button>
    </AuthCard>
  );
}
