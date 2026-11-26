// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import { ImageResponse } from "next/og";
import { getProjects, getSiteSettings } from "@/lib/api/public";
import { OG_SIZE, OgFrame, ogText } from "@/lib/og";
import { clip } from "@/lib/site";
import { colors } from "@/lib/theme";

// The picture shown when a project's page is shared (LinkedIn, WhatsApp, Slack, X...),
// in the site's colours. Always the English text: the image font has no Arabic letters,
// so Arabic would come out as empty boxes.
export const alt = "Project preview";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function ProjectImage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const [projects, settings] = await Promise.all([getProjects(), getSiteSettings()]);
  const project = projects.find((p) => p.slug === slug);
  const name = settings.fullName || "Portfolio";
  return new ImageResponse(
    <OgFrame path={`~/projects/${slug}`}>
      <div style={{ fontSize: 76, fontWeight: 700, marginTop: 16, letterSpacing: -2 }}>
        {project?.title ?? name}
      </div>
      {project?.summary && (
        <div style={{ fontSize: 32, color: ogText.soft, marginTop: 20, lineHeight: 1.3 }}>
          {clip(project.summary, 140)}
        </div>
      )}
      {project && project.tech.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 36 }}>
          {project.tech.slice(0, 6).map((tech) => (
            <div
              key={tech}
              style={{
                fontSize: 24,
                fontFamily: "monospace",
                color: ogText.soft,
                border: `2px solid ${colors.border}`,
                borderRadius: 999,
                padding: "6px 18px",
              }}
            >
              {tech}
            </div>
          ))}
        </div>
      )}
      <div style={{ fontSize: 26, color: colors.aurora.teal, marginTop: 40 }}>{name}</div>
    </OgFrame>,
    size
  );
}
