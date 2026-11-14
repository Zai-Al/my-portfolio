// Copyright (c) 2026 Zainab Alawi. All rights reserved.

// Server-side reads for the public pages (browser-side calls live in visitor.ts).
//
// Reads are cached by Next.js (tag "content") for up to an hour, so visitors get an instant
// page even while the Render backend is asleep. Saving in /admin refreshes the cache straight
// away (app/api/revalidate). If the backend can't be reached, the read returns empty data AND
// opts out of caching, so an empty page is never stored: on a background refresh Next.js keeps
// serving the last good page instead.

import type {
  Certification,
  Education,
  Experience,
  Guide,
  Project,
  SiteSettings,
  SkillCategory,
} from "@/lib/types";
import { emptySiteSettings } from "@/lib/types";
import { unstable_noStore as noStore } from "next/cache";
import { request } from "./http";

export const CONTENT_TAG = "content";
const cached: RequestInit = { next: { revalidate: 3600, tags: [CONTENT_TAG] } };

async function read<T>(path: string, fallback: T): Promise<T> {
  try {
    return await request<T>(path, { init: cached });
  } catch {
    noStore();
    return fallback;
  }
}

export const getExperiences = () => read<Experience[]>("/api/experiences", []);
export const getProjects = () => read<Project[]>("/api/projects", []);
export const getSkillCategories = () => read<SkillCategory[]>("/api/skill-categories", []);
export const getCertifications = () => read<Certification[]>("/api/certifications", []);
export const getEducation = () => read<Education[]>("/api/education", []);
export const getGuides = () => read<Guide[]>("/api/guides", []);
export const getSiteSettings = () => read<SiteSettings>("/api/site-settings", emptySiteSettings);
