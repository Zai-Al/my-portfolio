// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AuthActions, AuthCard, CodeInput } from "./AuthCard";

/** First login only: register an authenticator app by scanning a QR code. */
export default function EnrollMfa({
  onDone,
  onLogout,
}: {
  onDone: () => void;
  onLogout: () => void;
}) {
  const [factorId, setFactorId] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [entryName, setEntryName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // React strict mode runs effects twice in dev
    started.current = true;
    (async () => {
      // Clear half-finished enrollments from earlier attempts.
      const { data: factors } = await supabase.auth.mfa.listFactors();
      for (const f of factors?.all ?? []) {
        if (f.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Authenticator ${new Date().toISOString()}`,
      });
      if (enrollError || !data) return setError(enrollError?.message ?? "Couldn't start setup.");
      setFactorId(data.id);
      setQr(data.totp.qr_code);
      setSecret(data.totp.secret);
      // otpauth://totp/Issuer:account?...&issuer=Issuer - the name the app will show.
      try {
        const uri = new URL(data.totp.uri);
        const label = decodeURIComponent(uri.pathname.replace(/^\/+/, "").replace(/^totp\//, ""));
        setEntryName(
          uri.searchParams.get("issuer")
            ? `${uri.searchParams.get("issuer")} (${label.split(":").pop()})`
            : label
        );
      } catch {
        // leave the hint out if the URI is unexpected
      }
    })();
  }, []);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setError("");
    setBusy(true);
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    setBusy(false);
    if (verifyError) return setError(verifyError.message);
    onDone();
  }

  return (
    <AuthCard title="Set up two-factor login" onSubmit={verify}>
      <p className="mt-2 text-sm text-gray-400">
        Scan this with an authenticator app (Google Authenticator, Microsoft Authenticator,
        1Password…). Scan it on a second device too, as a backup if you lose your phone.
      </p>
      {qr ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={qr}
          alt="QR code for your authenticator app"
          className="mx-auto mt-4 h-48 w-48 rounded bg-white p-2"
        />
      ) : (
        !error && <p className="mt-4 font-mono text-xs text-gray-500">preparing…</p>
      )}
      {entryName && (
        <p className="mt-3 text-sm text-gray-300">
          After scanning, use the code from the{" "}
          <span className="font-semibold text-accent">new</span> entry named{" "}
          <span className="font-mono text-accent">{entryName}</span>, not any older entry.
        </p>
      )}
      <p className="mt-2 font-mono text-xs text-amber-300/80">
        Refreshing or logging out makes a new QR code. Delete older entries for this site from your
        app first.
      </p>
      {secret && (
        <details className="mt-3 font-mono text-xs text-gray-400">
          <summary className="cursor-pointer">can&apos;t scan? enter this key instead</summary>
          <p className="mt-2 break-all text-gray-200">{secret}</p>
        </details>
      )}
      <CodeInput value={code} onChange={setCode} />
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      <AuthActions busy={busy} label="verify & finish" onLogout={onLogout} />
    </AuthCard>
  );
}
