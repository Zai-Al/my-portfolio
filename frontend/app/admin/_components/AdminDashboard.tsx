// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useState } from "react";
import { refreshPublicPages } from "@/lib/revalidate";
import type { Certification, Education, Experience, Guide, Project } from "@/lib/types";
import { useAdminData } from "../_hooks/useAdminData";
import { useAdminPage } from "../_hooks/useAdminPage";
import type { useServerWake } from "../_hooks/useServerWake";
import { ADMIN_PAGES } from "../_lib/adminPages";
import { describeError } from "../_lib/describeError";
import {
  CERTIFICATION_FIELDS,
  EDUCATION_FIELDS,
  EXPERIENCE_FIELDS,
  GUIDE_FIELDS,
  PROJECT_FIELDS,
} from "../_lib/formConfig";
import AdminNav from "./AdminNav";
import AiKnowledgePanel from "./AiKnowledgePanel";
import CrudSection from "./CrudSection";
import Inbox from "./Inbox";
import ProfileForm from "./ProfileForm";
import ServerWakeNotice from "./ServerWakeNotice";
import SkillsAdmin from "./SkillsAdmin";

/** The signed-in portal: side menu plus one page per group of content. */
export default function AdminDashboard({
  token,
  server,
  onLogout,
}: {
  token: string;
  server: ReturnType<typeof useServerWake>;
  onLogout: () => void;
}) {
  // Content loads once the API is awake; until then the page shows the wake-up notice.
  const data = useAdminData(token, server.status === "ready");
  const [page, setPage] = useAdminPage();
  const [writeError, setWriteError] = useState("");

  // After any save: drop the public site's cache, and say so if that was refused.
  const publish = () => {
    refreshPublicPages(token).then((ok) => {
      if (!ok)
        setWriteError(
          "Saved, but the public site wasn't refreshed: your login session has ended (logging out in another tab ends it everywhere). Log out and back in, then save again. Otherwise the site catches up within the hour."
        );
    });
  };
  const onSaved = () => {
    setWriteError("");
    data.refresh();
    publish();
  };
  const onError = (e: unknown) => {
    setWriteError(describeError(e));
    data.refresh();
  };
  // Props every content section needs.
  const crud = { token, onChanged: onSaved, onError };

  const unread = data.messages.filter((m) => !m.read).length;
  const current = ADMIN_PAGES.find((p) => p.id === page) ?? ADMIN_PAGES[0];

  return (
    <div className="min-h-screen text-white md:flex">
      <AdminNav page={page} onSelect={setPage} unread={unread} onLogout={onLogout} />

      <main className="min-w-0 flex-1 px-4 py-8 md:px-10 md:py-12">
        <div className="mx-auto max-w-4xl">
          <header>
            <p className="font-mono text-xs text-accent">~/admin/{current.id}</p>
            <h1 className="mt-1 font-display text-2xl font-bold md:text-3xl">{current.label}</h1>
            <p className="mt-1 text-sm text-gray-400">{current.hint}</p>
          </header>

          {writeError && (
            <p
              role="alert"
              className="mt-6 rounded border border-red-500/40 bg-red-500/10 px-4 py-2 font-mono text-sm text-red-400"
            >
              {writeError}
            </p>
          )}

          {server.status !== "ready" ? (
            <div className="mt-8">
              <ServerWakeNotice
                status={server.status}
                startedAt={server.startedAt}
                onRetry={server.retry}
              />
            </div>
          ) : (
            <div className="mt-8 space-y-14">
              {page === "profile" && (
                <ProfileForm
                  token={token}
                  settings={data.settings}
                  onChange={data.setSettings}
                  onSaved={() => {
                    setWriteError("");
                    publish();
                  }}
                  onError={(e) => setWriteError(describeError(e))}
                />
              )}

              {page === "experience" && (
                <CrudSection<Experience>
                  {...crud}
                  title="Experience"
                  items={data.experiences}
                  basePath="/api/experiences"
                  fields={EXPERIENCE_FIELDS}
                  renderLabel={(e) => `${e.role} @ ${e.company}`}
                />
              )}

              {page === "education" && (
                <>
                  <CrudSection<Education>
                    {...crud}
                    title="Education"
                    items={data.education}
                    basePath="/api/education"
                    fields={EDUCATION_FIELDS}
                    renderLabel={(e) => `${e.degree} @ ${e.institution}`}
                  />
                  <CrudSection<Certification>
                    {...crud}
                    title="Certifications"
                    items={data.certifications}
                    basePath="/api/certifications"
                    fields={CERTIFICATION_FIELDS}
                    renderLabel={(c) => c.name}
                  />
                </>
              )}

              {page === "skills" && (
                <SkillsAdmin
                  token={token}
                  categories={data.skillCategories}
                  skills={data.skills}
                  onSaved={onSaved}
                  onError={onError}
                />
              )}

              {page === "projects" && (
                <CrudSection<Project>
                  {...crud}
                  title="Projects"
                  items={data.projects}
                  basePath="/api/projects"
                  fields={PROJECT_FIELDS}
                  renderLabel={(p) => p.title}
                />
              )}

              {page === "chatbot" && (
                <>
                  <CrudSection<Guide>
                    {...crud}
                    title="Chatbot guides"
                    items={data.guides}
                    basePath="/api/guides"
                    fields={GUIDE_FIELDS}
                    renderLabel={(g) => g.title}
                  />
                  <AiKnowledgePanel token={token} />
                </>
              )}

              {page === "inbox" && <Inbox {...crud} messages={data.messages} />}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
