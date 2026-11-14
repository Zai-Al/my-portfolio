// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AuthActions, AuthCard, CodeInput } from "./AuthCard";

/** Every later login: enter the current code from the authenticator app. */
export default function ChallengeMfa({
  onDone,
  onLogout,
}: {
  onDone: () => void;
  onLogout: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
    const factor = factors?.totp[0];
    if (listError || !factor) {
      setBusy(false);
      return setError(listError?.message ?? "No authenticator found for this account.");
    }
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: factor.id,
      code,
    });
    setBusy(false);
    if (verifyError) return setError(verifyError.message);
    onDone();
  }

  return (
    <AuthCard title="Enter your code" onSubmit={verify}>
      <p className="mt-2 text-sm text-gray-400">
        Open your authenticator app and enter the 6-digit code.
      </p>
      <CodeInput value={code} onChange={setCode} />
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      <AuthActions busy={busy} label="verify" onLogout={onLogout} />
    </AuthCard>
  );
}
