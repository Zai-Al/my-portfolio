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
  // Arabic versions, shown on /ar (null / empty = the English field is shown).
  companyAr: string | null;
  roleAr: string | null;
  departmentAr: string | null;
  locationAr: string | null;
  summaryAr: string | null;
  bulletsAr: string[];
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
  institutionAr: string | null;
  degreeAr: string | null;
  locationAr: string | null;
  awardsAr: string[];
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
  nameAr: string | null;
  issuerAr: string | null;
};

export type Skill = {
  id: number;
  name: string;
  skillCategoryId: number;
  icon: string;
  includes: string[];
  sortOrder: number;
  nameAr: string | null;
  includesAr: string[];
};

export type SkillCategory = {
  id: number;
  name: string;
  icon: string;
  sortOrder: number;
  skills: Skill[];
  nameAr: string | null;
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
  titleAr: string | null;
  summaryAr: string | null;
  descriptionAr: string | null;
  contextAr: string | null;
  myRoleAr: string | null;
  highlightsAr: string[];
  demoNotesAr: string | null;
};

export type Guide = {
  id: number;
  title: string;
  answer: string;
  keywords: string[];
  sortOrder: number;
  titleAr: string | null;
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
  /** Admin only: the public read always sends null (see hasEmail and the "Show email" button). */
  phone: string | null;
  /** Admin only: the public read always sends null (see hasEmail and the "Show email" button). */
  email: string | null;
  linkedInUrl: string | null;
  githubUrl: string | null;
  cvUrl: string | null;
  profileImageUrl: string | null;
  heroQuote: string | null;
  softSkills: string[];
  spokenLanguages: string[];
  // Arabic versions, shown on /ar (null / empty = the English field is shown).
  fullNameAr: string | null;
  headlineAr: string | null;
  bioAr: string | null;
  locationAr: string | null;
  availabilityAr: string | null;
  heroQuoteAr: string | null;
  softSkillsAr: string[];
  spokenLanguagesAr: string[];
  /** Set by the API: an email exists and can be revealed after the spam check. */
  hasEmail: boolean;
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
  fullNameAr: null,
  headlineAr: null,
  bioAr: null,
  locationAr: null,
  availabilityAr: null,
  heroQuoteAr: null,
  softSkillsAr: [],
  spokenLanguagesAr: [],
  hasEmail: false,
};
