// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

// The admin portal is only me; leave it out so it doesn't skew the numbers.
const skipAdmin = <T extends { url: string }>(event: T): T | null =>
  new URL(event.url).pathname.startsWith("/admin") ? null : event;

/**
 * Vercel Web Analytics (page views, no cookies) and Speed Insights (real visitors' load
 * times). Both send to this site's own /_vercel/* paths, so the CSP needs no change.
 * They only report on Vercel deployments; locally they do nothing.
 */
export default function Monitoring() {
  return (
    <>
      <Analytics beforeSend={(e: BeforeSendEvent) => skipAdmin(e)} />
      <SpeedInsights beforeSend={skipAdmin} />
    </>
  );
}
