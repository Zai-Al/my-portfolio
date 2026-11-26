// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import "./globals.css";

// The last resort: the page layout itself crashed, so there are no translations or site
// layout to lean on. Plain, in both languages, in the site's colours.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-void px-6 font-body text-white antialiased">
        <div className="max-w-md space-y-4 text-center">
          <p className="font-display text-6xl font-bold text-accent">:(</p>
          <p className="font-mono text-sm text-red-400">segmentation fault (core dumped)</p>
          <p className="text-gray-300">
            Something went wrong. The server may be waking up - try again in a few seconds.
          </p>
          <p dir="rtl" lang="ar" className="text-gray-300">
            حدث خطأ ما. قد يكون الخادم في طور التشغيل - حاول مرة أخرى بعد ثوانٍ.
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded border border-accent px-5 py-2 font-mono text-sm text-accent hover:bg-accent/10"
          >
            try again / حاول مرة أخرى
          </button>
        </div>
      </body>
    </html>
  );
}
