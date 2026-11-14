// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using Microsoft.AspNetCore.Mvc;
using PortfolioApi.Data;
using PortfolioApi.Models;

namespace PortfolioApi.Controllers;

[Route("api/education")]
public class EducationController : OrderedCrudController<Education>
{
    public EducationController(AppDbContext db) : base(db) { }
}
