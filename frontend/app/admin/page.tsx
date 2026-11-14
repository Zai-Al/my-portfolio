// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isAuthApiError, type AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import AdminDashboard from "./_components/AdminDashboard";
import { useServerWake } from "./_hooks/useServerWake";
import ChallengeMfa from "./_components/auth/ChallengeMfa";
import EnrollMfa from "./_components/auth/EnrollMfa";
import LoginForm from "./_components/auth/LoginForm";

// Only the empty shell is prerendered; who's signed in is checked in the browser,
// and the API itself enforces the admin lock-down.

/**
 * Admin dashboard, gated by Supabase Auth. There's exactly one admin user,
 * created directly in the Supabase dashboard (Authentication > Users) - no
 * public sign-up flow. Login is password + authenticator-app code (TOTP):
 * the backend only accepts tokens at assurance level "aal2", so the dashboard
 * is shown only after the code is verified.
 */
type Stage = "loading" | "login" | "enroll" | "challenge" | "ready";

// Supabase answered that this login no longer exists (logged out elsewhere, or revoked).
// Network trouble is not this: it never logs you out.
const sessionEnded = (error: AuthError | null) =>
  !!error && isAuthApiError(error) && (error.status === 401 || error.status === 403);

const RECHECK_AFTER_MS = 30_000;

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("loading");
  const [notice, setNotice] = useState("");
  const lastCheck = useRef(0);
  // Starts waking the API (free Render plan) right away, while the login is still being typed.
  const server = useServerWake();

  // Work out which screen to show from the current session's assurance level.
  const evaluate = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    setToken(session?.access_token ?? null);
    if (!session) return setStage("login");

    // getSession only reads this browser's copy; getUser asks Supabase whether the login
    // is still alive, so a session ended in another tab is caught before any editing.
    lastCheck.current = Date.now();
    const { error: userError } = await supabase.auth.getUser();
    if (sessionEnded(userError)) {
      setNotice("Your session ended (you logged out in another tab or window). Log in again.");
      await supabase.auth.signOut({ scope: "local" }); // fires SIGNED_OUT -> login screen
      return;
    }

    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error || !data) return setStage("login");
    if (data.currentLevel === "aal2") return setStage("ready");
    // nextLevel aal2 = a verified authenticator exists, so ask for its code.
    setStage(data.nextLevel === "aal2" ? "challenge" : "enroll");
  }, []);

  useEffect(() => {
    // Fires right away with INITIAL_SESSION, then on login, logout, token refresh, MFA verify.
    // Don't call other supabase methods inside this callback (it can deadlock); defer the check.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setToken(session?.access_token ?? null);
      setTimeout(evaluate, 0);
    });
    return () => listener.subscription.unsubscribe();
  }, [evaluate]);

  // Check again when coming back to this tab (at most every 30 s).
  useEffect(() => {
    if (stage !== "ready") return;
    const recheck = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastCheck.current < RECHECK_AFTER_MS) return;
      evaluate();
    };
    document.addEventListener("visibilitychange", recheck);
    window.addEventListener("focus", recheck);
    return () => {
      document.removeEventListener("visibilitychange", recheck);
      window.removeEventListener("focus", recheck);
    };
  }, [stage, evaluate]);

  async function logout() {
    setNotice("");
    await supabase.auth.signOut();
  }

  if (stage === "loading") return null;
  if (stage === "login") return <LoginForm notice={notice} />;
  if (stage === "enroll") return <EnrollMfa onDone={evaluate} onLogout={logout} />;
  if (stage === "challenge") return <ChallengeMfa onDone={evaluate} onLogout={logout} />;
  if (!token) return null;

  return <AdminDashboard token={token} server={server} onLogout={logout} />;
}
