// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using Microsoft.AspNetCore.Mvc;
using PortfolioApi.Data;
using PortfolioApi.Models;

namespace PortfolioApi.Controllers;

[Route("api/projects")]
public class ProjectsController : OrderedCrudController<Project>
{
    public ProjectsController(AppDbContext db) : base(db) { }

    // Same slug (it's the project's address, #project-<slug>) or same title.
    protected override Func<Project, Project, bool>? IsDuplicate => (a, b) =>
        Same(a.Slug, b.Slug) || Same(a.Title, b.Title);

    protected override string DuplicateMessage(Project candidate, Project existing) =>
        Same(candidate.Slug, existing.Slug)
            ? $"The slug \"{existing.Slug}\" is already used by \"{existing.Title}\". Each project needs its own slug."
            : $"A project called \"{existing.Title}\" already exists.";
}
