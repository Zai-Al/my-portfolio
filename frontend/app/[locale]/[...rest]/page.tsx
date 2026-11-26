// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import { notFound } from "next/navigation";

// Any other address under a language ("/some/old/link", "/ar/xyz") lands here, so it gets
// the site's own 404 page in that language instead of Next.js's plain default.
export default function CatchAll() {
  notFound();
}
