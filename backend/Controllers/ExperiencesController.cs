// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using Microsoft.AspNetCore.Mvc;
using PortfolioApi.Data;
using PortfolioApi.Models;

namespace PortfolioApi.Controllers;

[Route("api/experiences")]
public class ExperiencesController : OrderedCrudController<Experience>
{
    public ExperiencesController(AppDbContext db) : base(db) { }

    // Same company + role + start date. A second role (or a later stint) at the same company is fine.
    protected override Func<Experience, Experience, bool>? IsDuplicate => (a, b) =>
        Same(a.Company, b.Company) && Same(a.Role, b.Role) && Same(a.StartDate, b.StartDate);

    protected override string DuplicateMessage(Experience candidate, Experience existing) =>
        $"You already have this experience: {existing.Role} at {existing.Company}, starting {existing.StartDate}. " +
        "Edit that entry instead, or change the company, role or start date.";
}
