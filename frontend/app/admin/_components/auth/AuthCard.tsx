// Copyright (c) 2026 Zainab Alawi. All rights reserved.

// Building blocks shared by the login and two-factor screens.

export const authInputClass =
  "mt-3 w-full rounded border border-border bg-void px-3 py-2 font-mono text-sm text-white outline-none focus:border-accent";

export function AuthCard({
  title,
  children,
  onSubmit,
}: {
  title: string;
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-lg border border-border bg-panel/80 p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] backdrop-blur-md"
      >
        <h1 className="font-display text-xl font-semibold text-white">{title}</h1>
        {children}
      </form>
    </main>
  );
}

export function CodeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9]{6}"
      maxLength={6}
      autoFocus
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
      placeholder="6-digit code"
      aria-label="6-digit code from your authenticator app"
      className={`${authInputClass} tracking-[0.4em]`}
    />
  );
}

export function AuthActions({
  busy,
  label,
  onLogout,
}: {
  busy: boolean;
  label: string;
  onLogout: () => void;
}) {
  return (
    <div className="mt-4 flex gap-2">
      <button
        disabled={busy}
        className="flex-1 rounded bg-accent py-2 font-mono text-sm text-void disabled:opacity-50"
      >
        {busy ? "checking..." : label}
      </button>
      <button
        type="button"
        onClick={onLogout}
        className="rounded border border-border px-3 py-2 font-mono text-xs text-gray-300 hover:bg-white/5"
      >
        log out
      </button>
    </div>
  );
}
