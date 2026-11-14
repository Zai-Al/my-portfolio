// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using Microsoft.AspNetCore.Mvc;
using PortfolioApi.Data;
using PortfolioApi.Models;

namespace PortfolioApi.Controllers;

[Route("api/projects")]
public class ProjectsController : OrderedCrudController<Project>
{
    public ProjectsController(AppDbContext db) : base(db) { }
}
