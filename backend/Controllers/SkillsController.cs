// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using Microsoft.AspNetCore.Mvc;
using PortfolioApi.Data;
using PortfolioApi.Models;

namespace PortfolioApi.Controllers;

[Route("api/skills")]
public class SkillsController : OrderedCrudController<Skill>
{
    public SkillsController(AppDbContext db) : base(db) { }

    // Same name inside the same category. The same name in another category is fine.
    protected override Func<Skill, Skill, bool>? IsDuplicate => (a, b) =>
        a.SkillCategoryId == b.SkillCategoryId && Same(a.Name, b.Name);

    protected override string DuplicateMessage(Skill candidate, Skill existing) =>
        $"\"{existing.Name}\" is already in this category.";
}
