// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import { ImageResponse } from "next/og";
import { getProjects, getSiteSettings } from "@/lib/api/public";
import { clip } from "@/lib/site";

// The picture shown when a project's page is shared (LinkedIn, WhatsApp, Slack, X...),
// in the site's colours. Always the English text: the image font has no Arabic letters,
// so Arabic would come out as empty boxes.
export const alt = "Project preview";
export const size = { width: 1200, height: 630 };
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
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        background:
          "radial-gradient(circle at 15% 20%, rgba(31,209,163,0.35), transparent 45%), radial-gradient(circle at 85% 80%, rgba(124,108,255,0.35), transparent 50%), #0a0e14",
        color: "#ffffff",
        fontFamily: "sans-serif",
      }}
    >
      {/* One string: a <div> with several children would need display: flex here. */}
      <div style={{ fontSize: 28, color: "#00ff9d", fontFamily: "monospace" }}>
        {`~/projects/${slug}`}
      </div>
      <div style={{ fontSize: 76, fontWeight: 700, marginTop: 16, letterSpacing: -2 }}>
        {project?.title ?? name}
      </div>
      {project?.summary && (
        <div style={{ fontSize: 32, color: "#d1d5db", marginTop: 20, lineHeight: 1.3 }}>
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
                color: "#d1d5db",
                border: "2px solid #2a2f3a",
                borderRadius: 999,
                padding: "6px 18px",
              }}
            >
              {tech}
            </div>
          ))}
        </div>
      )}
      <div style={{ fontSize: 26, color: "#1fd1a3", marginTop: 40 }}>{name}</div>
    </div>,
    size
  );
}
