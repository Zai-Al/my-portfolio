// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// The public pages. /admin is left out on purpose.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/playground`, changeFrequency: "yearly", priority: 0.5 },
  ];
}
