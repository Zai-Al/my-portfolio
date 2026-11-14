// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using Microsoft.AspNetCore.Mvc;
using PortfolioApi.Data;
using PortfolioApi.Models;

namespace PortfolioApi.Controllers;

[Route("api/skills")]
public class SkillsController : OrderedCrudController<Skill>
{
    public SkillsController(AppDbContext db) : base(db) { }
}
