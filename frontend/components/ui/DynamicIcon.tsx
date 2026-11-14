// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import type { IconType } from "react-icons";
import {
  FaCode,
  FaLayerGroup,
  FaDatabase,
  FaCloud,
  FaTools,
  FaProjectDiagram,
  FaStar,
  FaGraduationCap,
  FaTicketAlt,
  FaJava,
  FaMicrosoft,
  FaBug,
  FaKeyboard,
  FaBraille,
  FaBriefcase,
  FaCertificate,
  FaUser,
  FaHome,
  FaPhone,
  FaGamepad,
  FaReact,
  FaNodeJs,
  FaPython,
  FaDocker,
  FaAws,
  FaGitAlt,
  FaGithub,
  FaLinux,
  FaWindows,
  FaApple,
  FaSwift,
  FaHtml5,
  FaCss3Alt,
  FaFolderOpen,
  FaCapsules,
  FaCogs,
  FaBitbucket,
  FaBolt,
  FaJira,
  FaKey,
  FaPhp,
  FaPlug,
  FaTerminal,
} from "react-icons/fa";
import {
  SiTypescript,
  SiDotnet,
  SiPostgresql,
  SiMongodb,
  SiFirebase,
  SiJavascript,
  SiNextdotjs,
  SiPostman,
  SiTailwindcss,
} from "react-icons/si";
import { TbBrandCSharp, TbBrandVscode } from "react-icons/tb";
import { GiSnake } from "react-icons/gi";

// The icons the site can show. A name stored in the database must be listed here, otherwise
// FaCode is shown instead (the admin icon field warns about that). To add one: import it
// and list it below. (SiCsharp and SiVisualstudiocode no longer exist in react-icons: use
// TbBrandCSharp and TbBrandVscode.)
const ICON_MAP: Record<string, IconType> = {
  FaCode,
  FaLayerGroup,
  FaDatabase,
  FaCloud,
  FaTools,
  FaProjectDiagram,
  FaStar,
  FaGraduationCap,
  FaTicketAlt,
  FaJava,
  FaMicrosoft,
  FaBug,
  FaKeyboard,
  FaBraille,
  FaBriefcase,
  FaCertificate,
  FaUser,
  FaHome,
  FaPhone,
  FaGamepad,
  FaReact,
  FaNodeJs,
  FaPython,
  FaDocker,
  FaAws,
  FaGitAlt,
  FaGithub,
  FaLinux,
  FaWindows,
  FaApple,
  FaSwift,
  FaHtml5,
  FaCss3Alt,
  FaFolderOpen,
  FaCapsules,
  FaCogs,
  FaBitbucket,
  FaBolt,
  FaJira,
  FaKey,
  FaPhp,
  FaPlug,
  FaTerminal,
  SiTypescript,
  SiDotnet,
  SiPostgresql,
  SiMongodb,
  SiFirebase,
  SiJavascript,
  SiNextdotjs,
  SiPostman,
  SiTailwindcss,
  TbBrandCSharp,
  TbBrandVscode,
  GiSnake,
};

/** Every icon name the site understands, for the admin icon picker. */
export const ICON_NAMES = Object.keys(ICON_MAP).sort();

export const isKnownIcon = (name?: string | null): boolean =>
  !!name && Object.hasOwn(ICON_MAP, name);

export default function DynamicIcon({
  name,
  className,
}: {
  name?: string | null;
  className?: string;
}) {
  const Icon = name && isKnownIcon(name) ? ICON_MAP[name] : FaCode;
  return <Icon className={className} />;
}
