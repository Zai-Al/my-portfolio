// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import { supabase } from "./supabaseClient";

// Supabase Storage bucket for the site's files. Reading is public; uploading needs the
// admin signed in with password + authenticator code (bucket policies in Supabase).
export const MEDIA_BUCKET = "portfolio-media";
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // matches the bucket's limit
export const IMAGE_TYPES = "image/png,image/jpeg,image/webp,image/gif,image/avif";
export const PDF_TYPE = "application/pdf";

/** "My CV (final).pdf" -> "my-cv-final" */
function safeName(fileName: string) {
  const base = fileName.replace(/\.[^.]+$/, "");
  return (
    base
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "file"
  );
}

/**
 * Uploads one file into `folder` (e.g. "certificates", "projects/rentops") and returns its
 * public URL. The name gets a random suffix, so a new upload never reuses an old URL that
 * browsers or Vercel may still have cached.
 */
export async function uploadMedia(file: File, folder: string): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error(`"${file.name}" is over 10 MB.`);
  const ext = (file.name.match(/\.([a-z0-9]+)$/i)?.[1] ?? "bin").toLowerCase();
  const cleanFolder = folder.replace(/^\/+|\/+$/g, "") || "misc";
  const path = `${cleanFolder}/${safeName(file.name)}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    cacheControl: "31536000", // a year: the name changes whenever the file does
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) {
    const msg = error.message || "Upload failed.";
    if (/row-level security|unauthorized|403/i.test(msg))
      throw new Error("Upload refused: log out and back in with your authenticator code.");
    if (/bucket not found/i.test(msg))
      throw new Error("The portfolio-media bucket doesn't exist yet (Step 3.3 setup SQL).");
    if (/mime type|not supported/i.test(msg))
      throw new Error(
        `"${file.name}": only images (PNG, JPG, WebP, GIF, AVIF) and PDF are allowed.`
      );
    throw new Error(msg);
  }
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}
