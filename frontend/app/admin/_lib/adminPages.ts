// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import type { IconType } from "react-icons";
import {
  FaBriefcase,
  FaGraduationCap,
  FaInbox,
  FaLayerGroup,
  FaProjectDiagram,
  FaRobot,
  FaUser,
} from "react-icons/fa";

// --- Side menu: one page per group of related content ---
export type AdminPageId =
  | "profile"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "chatbot"
  | "inbox";

export const ADMIN_PAGES: { id: AdminPageId; label: string; hint: string; Icon: IconType }[] = [
  {
    id: "profile",
    label: "Profile & CV",
    hint: "Hero, About and Contact content, CV link and photo. Also used as AI context.",
    Icon: FaUser,
  },
  {
    id: "experience",
    label: "Experience",
    hint: "Jobs and internships shown in the Experience section.",
    Icon: FaBriefcase,
  },
  {
    id: "education",
    label: "Education & Certs",
    hint: "Degrees and awards, plus certificates with their verify links.",
    Icon: FaGraduationCap,
  },
  {
    id: "skills",
    label: "Skills",
    hint: "Skill categories and the skills inside them.",
    Icon: FaLayerGroup,
  },
  {
    id: "projects",
    label: "Projects",
    hint: "Project cards and their detail popups.",
    Icon: FaProjectDiagram,
  },
  {
    id: "chatbot",
    label: "AI Chatbot",
    hint: "The chatbot's guide answers and its AI knowledge.",
    Icon: FaRobot,
  },
  { id: "inbox", label: "Inbox", hint: "Messages sent through the contact form.", Icon: FaInbox },
];
