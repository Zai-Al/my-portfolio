// Copyright (c) 2026 Zainab Alawi. All rights reserved.

// Which fields each admin form shows, in order. Change labels or add a field here;
// the forms (CrudSection, ProfileForm) render whatever is listed. SortOrder is not a
// field: the ↑/↓ buttons in each list set it.

import type {
  Certification,
  Education,
  Experience,
  Guide,
  Project,
  SiteSettings,
  Skill,
  SkillCategory,
} from "@/lib/types";
import { IMAGE_TYPES, PDF_TYPE } from "@/lib/storage";
import type { FieldConfig, SelectOption } from "./fields";

const ICON_FIELD = { label: "Icon", type: "icon" as const };

/**
 * The Arabic copy of a text field, placed right under the English one. Shown on /ar; left
 * empty, the site shows the English text there instead.
 */
const arabic = <T>(
  key: keyof T,
  label: string,
  type: "text" | "textarea" | "list" | "lines"
): FieldConfig<T> => ({ key, label: `${label} · عربي`, type, arabic: true });

/** Upload folder per project, e.g. "projects/rentops" (before a slug is set: "projects/unsorted"). */
const projectFolder = (p: Partial<Project>) =>
  `projects/${
    (p.slug ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "unsorted"
  }`;

export const SETTINGS_FIELDS: FieldConfig<SiteSettings>[] = [
  { key: "fullName", label: "Full name", type: "text" },
  arabic("fullNameAr", "Full name", "text"),
  { key: "headline", label: "Headline", type: "text" },
  arabic("headlineAr", "Headline", "text"),
  { key: "bio", label: "Profile summary (also used as AI context)", type: "textarea" },
  arabic("bioAr", "Profile summary", "textarea"),
  {
    key: "seoDescription",
    label:
      "SEO description: what Google and link previews show (about 160 characters; empty = the first sentence of the profile summary)",
    type: "textarea",
  },
  arabic("seoDescriptionAr", "SEO description", "textarea"),
  { key: "location", label: "Location", type: "text" },
  arabic("locationAr", "Location", "text"),
  { key: "availability", label: "Availability", type: "text" },
  arabic("availabilityAr", "Availability", "text"),
  { key: "heroQuote", label: "Hero quote", type: "text" },
  arabic("heroQuoteAr", "Hero quote", "text"),
  { key: "phone", label: "Phone (private: never shown on the site)", type: "text" },
  {
    key: "email",
    label: "Email (shown only via the spam-checked “Show email” button)",
    type: "text",
  },
  { key: "linkedInUrl", label: "LinkedIn URL", type: "text" },
  { key: "githubUrl", label: "GitHub URL", type: "text" },
  { key: "cvUrl", label: "CV (PDF)", type: "file", accept: PDF_TYPE, folder: () => "cv" },
  {
    key: "profileImageUrl",
    label: "Profile photo",
    type: "file",
    accept: IMAGE_TYPES,
    folder: () => "profile",
  },
  { key: "softSkills", label: "Soft skills (comma separated)", type: "list" },
  arabic("softSkillsAr", "Soft skills (comma separated)", "list"),
  { key: "spokenLanguages", label: "Spoken languages (comma separated)", type: "list" },
  arabic("spokenLanguagesAr", "Spoken languages, e.g. العربية (اللغة الأم)", "list"),
];

export const EXPERIENCE_FIELDS: FieldConfig<Experience>[] = [
  { key: "company", label: "Company", type: "text" },
  arabic("companyAr", "Company", "text"),
  { key: "role", label: "Role", type: "text" },
  arabic("roleAr", "Role", "text"),
  { key: "department", label: "Department", type: "text" },
  arabic("departmentAr", "Department", "text"),
  { key: "location", label: "Location", type: "text" },
  arabic("locationAr", "Location", "text"),
  { key: "startDate", label: "Start date", type: "text" },
  { key: "endDate", label: "End date (empty = present)", type: "text" },
  { key: "summary", label: "Summary", type: "textarea" },
  arabic("summaryAr", "Summary", "textarea"),
  { key: "bullets", label: "Bullet points (one per line)", type: "lines" },
  arabic("bulletsAr", "Bullet points (one per line)", "lines"),
  { key: "tech", label: "Tech (comma separated)", type: "list" },
  { key: "icon", ...ICON_FIELD },
  {
    key: "proofImageUrl",
    label: "Proof image (shown on View)",
    type: "file",
    accept: IMAGE_TYPES,
    folder: () => "experience",
  },
];

export const EDUCATION_FIELDS: FieldConfig<Education>[] = [
  { key: "institution", label: "Institution", type: "text" },
  arabic("institutionAr", "Institution", "text"),
  { key: "degree", label: "Degree", type: "text" },
  arabic("degreeAr", "Degree", "text"),
  { key: "location", label: "Location", type: "text" },
  arabic("locationAr", "Location", "text"),
  { key: "startDate", label: "Start date", type: "text" },
  { key: "endDate", label: "End date", type: "text" },
  { key: "awards", label: "Awards (one per line)", type: "lines" },
  arabic("awardsAr", "Awards (one per line)", "lines"),
  { key: "icon", ...ICON_FIELD },
];

export const CERTIFICATION_FIELDS: FieldConfig<Certification>[] = [
  { key: "name", label: "Name", type: "text" },
  arabic("nameAr", "Name", "text"),
  { key: "issuer", label: "Issuer", type: "text" },
  arabic("issuerAr", "Issuer", "text"),
  { key: "issueDate", label: "Issue date", type: "text" },
  { key: "expiryDate", label: "Expiry date", type: "text" },
  { key: "credentialId", label: "Credential ID", type: "text" },
  { key: "credentialUrl", label: "Credential URL", type: "text" },
  {
    key: "imageUrl",
    label: "Certificate image",
    type: "file",
    accept: IMAGE_TYPES,
    folder: () => "certificates",
  },
  { key: "icon", ...ICON_FIELD },
];

export const CATEGORY_FIELDS: FieldConfig<SkillCategory>[] = [
  { key: "name", label: "Name", type: "text" },
  arabic("nameAr", "Name", "text"),
  { key: "icon", ...ICON_FIELD },
];

/** Skill fields need the current categories for the dropdown. */
export const skillFields = (categoryOptions: SelectOption[]): FieldConfig<Skill>[] => [
  { key: "name", label: "Name", type: "text" },
  arabic("nameAr", "Name (leave empty for tech names)", "text"),
  { key: "skillCategoryId", label: "Category", type: "select", options: categoryOptions },
  { key: "icon", ...ICON_FIELD },
  { key: "includes", label: "Includes, shown on hover (comma separated)", type: "list" },
  arabic("includesAr", "Includes (comma separated)", "list"),
];

export const PROJECT_FIELDS: FieldConfig<Project>[] = [
  { key: "title", label: "Title", type: "text" },
  arabic("titleAr", "Title", "text"),
  { key: "slug", label: "Slug (unique, e.g. quickpharma-plus)", type: "text" },
  { key: "summary", label: "Summary (one line)", type: "text" },
  arabic("summaryAr", "Summary (one line)", "text"),
  { key: "description", label: "Description", type: "textarea" },
  arabic("descriptionAr", "Description", "textarea"),
  {
    key: "challenge",
    label: "Case study: the challenge (the problem it solved; optional)",
    type: "textarea",
  },
  arabic("challengeAr", "The challenge", "textarea"),
  { key: "context", label: "Context (e.g. Senior Project · Bahrain Polytechnic)", type: "text" },
  arabic("contextAr", "Context", "text"),
  { key: "myRole", label: "My role", type: "textarea" },
  arabic("myRoleAr", "My role", "textarea"),
  { key: "highlights", label: "Highlights (one per line)", type: "lines" },
  arabic("highlightsAr", "Highlights (one per line)", "lines"),
  { key: "learned", label: "Case study: what I learned (optional)", type: "textarea" },
  arabic("learnedAr", "What I learned", "textarea"),
  { key: "tech", label: "Tech (comma separated)", type: "list" },
  {
    key: "screenshots",
    label: "Screenshots",
    type: "files",
    accept: IMAGE_TYPES,
    folder: projectFolder,
  },
  { key: "icon", ...ICON_FIELD },
  { key: "repoUrl", label: "Repo URL", type: "text" },
  { key: "showRepo", label: "Show the “view repo” button", type: "bool" },
  { key: "demoUrl", label: "Demo URL", type: "text" },
  { key: "showDemo", label: "Show the “view demo” button", type: "bool" },
  { key: "demoNotes", label: "Demo notes (e.g. demo logins)", type: "textarea" },
  arabic("demoNotesAr", "Demo notes", "textarea"),
  { key: "year", label: "Year", type: "text" },
  { key: "featured", label: "Featured", type: "bool" },
];

export const GUIDE_FIELDS: FieldConfig<Guide>[] = [
  { key: "title", label: "Question / title", type: "text" },
  arabic("titleAr", "Question / title (starter question on /ar)", "text"),
  { key: "answer", label: "Answer", type: "textarea" },
  { key: "keywords", label: "Keywords (comma separated)", type: "list" },
];
