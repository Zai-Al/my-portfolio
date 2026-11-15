// Copyright (c) 2026 Zainab Alawi. All rights reserved.

// What each admin list can be searched by (the matching rules are in search.ts).
// Text boxes search the name shown in the list, so results are what you'd expect from what
// you see; the inbox gets one box per part of a message.

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
  fields: [{ key: "q", label: "Role or company", text: (e) => `${e.role} ${e.company}` }],
};

export const EDUCATION_SEARCH: SearchConfig<Education> = {
  label: "education",
  fields: [
    { key: "q", label: "Degree or institution", text: (e) => `${e.degree} ${e.institution}` },
  ],
};

/** The issuer chips come from the certifications that exist. */
export function certificationSearch(certifications: Certification[]): SearchConfig<Certification> {
  const issuers = [...new Set(certifications.map((c) => c.issuer.trim()))].filter(Boolean).sort();
  return {
    label: "certifications",
    fields: [{ key: "q", label: "Name", text: (c) => c.name }],
    chips:
      issuers.length > 1
        ? [
            {
              key: "issuer",
              label: "Issuer",
              options: [ALL, ...issuers.map((i) => ({ value: i, label: i }))],
              test: (c, issuer) => c.issuer.trim() === issuer,
            },
          ]
        : [],
  };
}

export const SKILL_SEARCH: SearchConfig<Skill> = {
  label: "skills",
  fields: [{ key: "q", label: "Skill", text: (s) => s.name }],
};

export const PROJECT_SEARCH: SearchConfig<Project> = {
  label: "projects",
  fields: [{ key: "q", label: "Title", text: (p) => p.title }],
  chips: [
    {
      key: "featured",
      label: "Show",
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
  fields: [{ key: "q", label: "Question", text: (g) => g.title }],
};

export const INBOX_SEARCH: SearchConfig<ContactMessage> = {
  label: "messages",
  fields: [
    { key: "from", label: "From (name or email)", text: (m) => `${m.name} ${m.email}` },
    { key: "subject", label: "Subject", text: (m) => m.subject },
    { key: "message", label: "Message", text: (m) => m.message },
  ],
  chips: [
    {
      key: "status",
      label: "Show",
      options: [ALL, { value: "unread", label: "Unread" }, { value: "read", label: "Read" }],
      test: (m, v) => (v === "unread" ? !m.read : m.read),
    },
    {
      key: "sort",
      label: "Sort",
      options: [
        { value: "", label: "Newest first" },
        { value: "oldest", label: "Oldest first" },
      ],
    },
  ],
  dateRange: { label: "Received", date: (m) => m.receivedAt },
};
