// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Maps "/" to the English pages and "/ar" to the Arabic ones (next-intl).
export default createMiddleware(routing);

export const config = {
  // Everything except the API routes, the admin portal (English only), Next.js and Vercel
  // internals, the generated icons and preview image, and files (anything with a dot).
  matcher: "/((?!api|admin|_next|_vercel|opengraph-image|apple-icon|icon|.*\\..*).*)",
};
