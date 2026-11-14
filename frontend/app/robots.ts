// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Search engines may index the public pages, not the admin portal or the API routes.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
