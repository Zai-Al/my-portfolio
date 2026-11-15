// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using Microsoft.AspNetCore.Mvc;
using PortfolioApi.Data;
using PortfolioApi.Models;

namespace PortfolioApi.Controllers;

[Route("api/education")]
public class EducationController : OrderedCrudController<Education>
{
    public EducationController(AppDbContext db) : base(db) { }

    // Same institution + degree. Another degree at the same institution is fine.
    protected override Func<Education, Education, bool>? IsDuplicate => (a, b) =>
        Same(a.Institution, b.Institution) && Same(a.Degree, b.Degree);

    protected override string DuplicateMessage(Education candidate, Education existing) =>
        $"You already have {existing.Degree} at {existing.Institution}. " +
        "Edit that entry instead, or change the institution or degree.";
}
