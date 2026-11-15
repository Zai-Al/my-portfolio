// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortfolioApi.Data;
using PortfolioApi.Models;

namespace PortfolioApi.Controllers;

[Route("api/skill-categories")]
public class SkillCategoriesController : OrderedCrudController<SkillCategory>
{
    public SkillCategoriesController(AppDbContext db) : base(db) { }

    protected override Func<SkillCategory, SkillCategory, bool>? IsDuplicate => (a, b) => Same(a.Name, b.Name);

    protected override string DuplicateMessage(SkillCategory candidate, SkillCategory existing) =>
        $"A skill category named \"{existing.Name}\" already exists.";

    // Categories come back with their skills nested, both in display order.
    [HttpGet]
    [AllowAnonymous]
    public override async Task<IActionResult> GetAll() =>
        Ok(await Db.SkillCategories
            .AsNoTracking()
            .Include(c => c.Skills.OrderBy(s => s.SortOrder).ThenBy(s => s.Id))
            .OrderBy(c => c.SortOrder).ThenBy(c => c.Id)
            .ToListAsync());

    // Skills are managed through /api/skills; ignore any nested list sent here.
    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public override Task<IActionResult> Create(SkillCategory entity)
    {
        entity.Skills = new();
        return base.Create(entity);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "AdminOnly")]
    public override async Task<IActionResult> Update(int id, SkillCategory updated)
    {
        updated.Skills = new();
        return await base.Update(id, updated);
    }
}
