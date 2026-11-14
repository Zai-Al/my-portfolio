// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using Microsoft.AspNetCore.Mvc;
using PortfolioApi.Data;
using PortfolioApi.Models;

namespace PortfolioApi.Controllers;

[Route("api/experiences")]
public class ExperiencesController : OrderedCrudController<Experience>
{
    public ExperiencesController(AppDbContext db) : base(db) { }
}
