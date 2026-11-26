// Copyright (c) 2026 Zainab Alawi. All rights reserved.

// Where the site's uploaded files live (Supabase Storage), in one place: the upload code,
// next.config.js (which images next/image may optimise) and the image components read it.

const MEDIA_BUCKET = "portfolio-media";

/** The public path of every file in the bucket, after the Supabase host. */
const MEDIA_PATH = `/storage/v1/object/public/${MEDIA_BUCKET}/`;

/**
 * True for a file in our own bucket. Only those go through next/image's optimiser (the only
 * host allowed in next.config.js); any other image URL is shown as it is.
 * @param {string} url
 */
const isMediaUrl = (url) => url.includes(MEDIA_PATH);

module.exports = { MEDIA_BUCKET, MEDIA_PATH, isMediaUrl };
