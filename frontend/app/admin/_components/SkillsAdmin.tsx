// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useState } from "react";
import type { Skill, SkillCategory } from "@/lib/types";
import { CATEGORY_FIELDS, skillFields } from "../_lib/formConfig";
import CrudSection from "./CrudSection";

// --- Skills page: categories, plus skills filtered by category ---
export default function SkillsAdmin({
  token,
  categories,
  skills,
  onSaved,
  onError,
}: {
  token: string;
  categories: SkillCategory[];
  skills: Skill[];
  onSaved: () => void;
  onError: (e: unknown) => void;
}) {
  const [filter, setFilter] = useState<number | "all">("all");

  const sortedCategories = [...categories].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  const categoryOrder = new Map(sortedCategories.map((c, i) => [c.id, i]));
  const categoryName = (id: number) => categories.find((c) => c.id === id)?.name ?? "(no category)";
  const countIn = (id: number) => skills.filter((s) => s.skillCategoryId === id).length;

  // A deleted category can't stay selected.
  const activeFilter = filter !== "all" && categoryOrder.has(filter) ? filter : "all";

  // Grouped by category order, then each skill's own order.
  const visibleSkills = skills
    .filter((s) => activeFilter === "all" || s.skillCategoryId === activeFilter)
    .sort(
      (a, b) =>
        (categoryOrder.get(a.skillCategoryId) ?? 999) -
          (categoryOrder.get(b.skillCategoryId) ?? 999) ||
        a.sortOrder - b.sortOrder ||
        a.id - b.id
    );

  const categoryOptions = sortedCategories.map((c) => ({ value: c.id, label: c.name }));
  const defaultCategory = activeFilter === "all" ? sortedCategories[0]?.id : activeFilter;

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 font-mono text-xs transition-colors ${
      active
        ? "border-accent bg-accent/10 text-accent"
        : "border-border text-gray-400 hover:border-gray-500 hover:text-gray-200"
    }`;

  return (
    <>
      <CrudSection<SkillCategory>
        title="Categories"
        token={token}
        items={sortedCategories}
        basePath="/api/skill-categories"
        fields={CATEGORY_FIELDS}
        renderLabel={(c) => `${c.name} (${countIn(c.id)} skills)`}
        confirmDelete={(c) =>
          `Its ${countIn(c.id)} skill(s) will be deleted too. This can't be undone.`
        }
        onChanged={onSaved}
        onError={onError}
      />

      <div>
        <div
          role="group"
          aria-label="Filter skills by category"
          className="mb-4 flex flex-wrap gap-2"
        >
          <button
            onClick={() => setFilter("all")}
            aria-pressed={activeFilter === "all"}
            className={chip(activeFilter === "all")}
          >
            All ({skills.length})
          </button>
          {sortedCategories.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              aria-pressed={activeFilter === c.id}
              className={chip(activeFilter === c.id)}
            >
              {c.name} ({countIn(c.id)})
            </button>
          ))}
        </div>

        {categories.length === 0 ? (
          <p className="font-mono text-sm text-gray-500">
            Add a category first, then add skills to it.
          </p>
        ) : (
          <CrudSection<Skill>
            title={activeFilter === "all" ? "Skills" : `Skills · ${categoryName(activeFilter)}`}
            token={token}
            items={visibleSkills}
            basePath="/api/skills"
            fields={skillFields(categoryOptions)}
            defaults={{ skillCategoryId: defaultCategory }}
            groupOf={activeFilter === "all" ? (s) => categoryName(s.skillCategoryId) : undefined}
            renderLabel={(s) => s.name}
            search={{ label: "skills", text: (s) => [s.name, s.includes] }}
            onChanged={onSaved}
            onError={onError}
          />
        )}
      </div>
    </>
  );
}
