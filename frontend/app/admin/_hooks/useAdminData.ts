// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import { useCallback, useEffect, useState } from "react";
import { adminGet, getMessages } from "@/lib/api/admin";
import type {
  Certification,
  ContactMessage,
  Education,
  Experience,
  Guide,
  Project,
  SiteSettings,
  Skill,
  SkillCategory,
} from "@/lib/types";
import { emptySiteSettings } from "@/lib/types";

/**
 * Everything the admin portal edits, loaded together and reloaded after each change.
 * Nothing loads until `enabled` (the API is awake), so empty lists never mean "still waiting".
 */
export function useAdminData(token: string, enabled = true) {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(emptySiteSettings);

  const refresh = useCallback(() => {
    // A failed load keeps the previous data on screen; saving shows its own errors.
    const load = <T>(path: string, set: (v: T) => void) =>
      adminGet<T>(path)
        .then(set)
        .catch(() => {});
    load("/api/experiences", setExperiences);
    load("/api/projects", setProjects);
    load("/api/skill-categories", setSkillCategories);
    load("/api/skills", setSkills);
    load("/api/certifications", setCertifications);
    load("/api/education", setEducation);
    load("/api/guides", setGuides);
    load<SiteSettings>("/api/site-settings", (s) => setSettings({ ...emptySiteSettings, ...s }));
    getMessages(token)
      .then(setMessages)
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (enabled) refresh();
  }, [enabled, refresh]);

  return {
    experiences,
    projects,
    skillCategories,
    skills,
    certifications,
    education,
    guides,
    messages,
    settings,
    setSettings,
    refresh,
  };
}
