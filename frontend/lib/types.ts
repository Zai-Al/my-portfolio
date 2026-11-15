// Copyright (c) 2026 Zainab Alawi. All rights reserved.

// Shapes of the data the ASP.NET API returns (camelCase JSON).

export type Experience = {
  id: number;
  company: string;
  role: string;
  department: string | null;
  location: string | null;
  startDate: string;
  endDate: string | null; // null = present
  summary: string;
  bullets: string[];
  tech: string[];
  icon: string; // react-icons component name
  proofImageUrl: string | null;
  sortOrder: number;
};

export type Education = {
  id: number;
  institution: string;
  degree: string;
  location: string | null;
  startDate: string;
  endDate: string | null;
  awards: string[];
  icon: string;
  sortOrder: number;
};

export type Certification = {
  id: number;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate: string | null;
  credentialId: string | null;
  credentialUrl: string | null;
  imageUrl: string | null;
  icon: string;
  sortOrder: number;
};

export type Skill = {
  id: number;
  name: string;
  skillCategoryId: number;
  icon: string;
  includes: string[];
  sortOrder: number;
};

export type SkillCategory = {
  id: number;
  name: string;
  icon: string;
  sortOrder: number;
  skills: Skill[];
};

export type Project = {
  id: number;
  title: string;
  slug: string;
  summary: string;
  description: string;
  context: string | null;
  myRole: string | null;
  highlights: string[];
  tech: string[];
  screenshots: string[];
  icon: string;
  repoUrl: string | null;
  demoUrl: string | null;
  demoNotes: string | null;
  year: string | null;
  featured: boolean;
  sortOrder: number;
};

export type Guide = {
  id: number;
  title: string;
  answer: string;
  keywords: string[];
  sortOrder: number;
};

export type ContactMessage = {
  id: number;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  receivedAt: string;
  read: boolean;
};

export type SiteSettings = {
  id: number;
  fullName: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  availability: string | null;
  phone: string | null;
  email: string | null;
  linkedInUrl: string | null;
  githubUrl: string | null;
  cvUrl: string | null;
  profileImageUrl: string | null;
  heroQuote: string | null;
  softSkills: string[];
  spokenLanguages: string[];
};

export const emptySiteSettings: SiteSettings = {
  id: 1,
  fullName: null,
  headline: null,
  bio: null,
  location: null,
  availability: null,
  phone: null,
  email: null,
  linkedInUrl: null,
  githubUrl: null,
  cvUrl: null,
  profileImageUrl: null,
  heroQuote: null,
  softSkills: [],
  spokenLanguages: [],
};
