// Copyright (c) 2026 Zainab Alawi. All rights reserved.

// What each admin list can be searched by (the matching rules are in search.ts).
// The search box looks in the name shown in the list, so results match what you see; the inbox
// has a "by name / by subject" dropdown. Chips are always shown above the list, like Skills.

import type {
  Certification,
  ContactMessage,
  Education,
  Experience,
  Guide,
  Project,
  Skill,
} from "@/lib/types";
import type { SearchConfig } from "./search";

const ALL = { value: "", label: "All" };

export const EXPERIENCE_SEARCH: SearchConfig<Experience> = {
  label: "experience",
  fields: [{ key: "q", label: "role or company", text: (e) => `${e.role} ${e.company}` }],
};

export const EDUCATION_SEARCH: SearchConfig<Education> = {
  label: "education",
  fields: [
    { key: "q", label: "degree or institution", text: (e) => `${e.degree} ${e.institution}` },
  ],
};

/** The issuer chips come from the certifications that exist. */
export function certificationSearch(certifications: Certification[]): SearchConfig<Certification> {
  const issuers = [...new Set(certifications.map((c) => c.issuer.trim()))].filter(Boolean).sort();
  return {
    label: "certifications",
    fields: [{ key: "q", label: "name", text: (c) => c.name }],
    chips:
      issuers.length > 1
        ? [
            {
              key: "issuer",
              options: [ALL, ...issuers.map((i) => ({ value: i, label: i }))],
              test: (c, issuer) => c.issuer.trim() === issuer,
            },
          ]
        : [],
  };
}

export const SKILL_SEARCH: SearchConfig<Skill> = {
  label: "skills",
  fields: [{ key: "q", label: "name", text: (s) => s.name }],
};

export const PROJECT_SEARCH: SearchConfig<Project> = {
  label: "projects",
  fields: [{ key: "q", label: "title", text: (p) => p.title }],
  chips: [
    {
      key: "featured",
      options: [
        ALL,
        { value: "featured", label: "Featured" },
        { value: "other", label: "Not featured" },
      ],
      test: (p, v) => (v === "featured" ? p.featured : !p.featured),
    },
  ],
};

export const GUIDE_SEARCH: SearchConfig<Guide> = {
  label: "chatbot guides",
  fields: [{ key: "q", label: "question", text: (g) => g.title }],
};

export const INBOX_SEARCH: SearchConfig<ContactMessage> = {
  label: "messages",
  fields: [
    { key: "name", label: "name", text: (m) => m.name },
    { key: "subject", label: "subject", text: (m) => m.subject },
  ],
  chips: [
    {
      key: "status",
      options: [ALL, { value: "unread", label: "Unread" }, { value: "read", label: "Read" }],
      test: (m, v) => (v === "unread" ? !m.read : m.read),
    },
    {
      key: "sort",
      options: [
        { value: "", label: "Newest first" },
        { value: "oldest", label: "Oldest first" },
      ],
    },
  ],
  date: (m) => m.receivedAt,
};
