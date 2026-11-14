// Copyright (c) 2026 Zainab Alawi. All rights reserved.

const isDev = process.env.NODE_ENV !== "production";

// Only the origin part of a URL (scheme + host + port), or null if unset/invalid.
function origin(url) {
  try {
    return url ? new URL(url).origin : null;
  } catch {
    return null;
  }
}

const apiOrigin = origin(process.env.NEXT_PUBLIC_API_URL);
const supabaseOrigin = origin(process.env.NEXT_PUBLIC_SUPABASE_URL);

// Content-Security-Policy: the browser may only load things from the places listed here.
// If a new outside service is added (images, scripts, APIs), it has to be added here too.
const csp = [
  "default-src 'self'",
  // Next.js injects small inline scripts; dev mode also needs eval for hot reload, and
  // Vercel Analytics / Speed Insights load their debug scripts from va.vercel-scripts.com
  // (in production they're served from this site's own /_vercel/* paths instead).
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval' https://va.vercel-scripts.com" : ""}`,
  // Inline styles come from Framer Motion; the fonts' CSS comes from Google Fonts.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  // data: is the two-factor QR code; Supabase is for images once they move to Storage (Step 3.3).
  ["img-src 'self' data: blob:", supabaseOrigin].filter(Boolean).join(" "),
  // Who the page may call: our API, Supabase Auth, GitHub stats (terminal), dev hot reload.
  ["connect-src 'self'", apiOrigin, supabaseOrigin, "https://api.github.com", isDev && "ws:"]
    .filter(Boolean)
    .join(" "),
  "frame-src 'none'",
  "frame-ancestors 'none'", // nobody may put this site (or /admin) inside a frame
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" }, // older browsers' version of frame-ancestors
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

// next/image may only resize pictures from the site's own Storage bucket.
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return null;
  }
})();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // don't advertise "X-Powered-By: Next.js"
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/portfolio-media/**",
          },
        ]
      : [],
    // WebP only: AVIF is a bit smaller but slow to create, which made the gallery lag.
    formats: ["image/webp"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

module.exports = nextConfig;
