// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using Microsoft.AspNetCore.Mvc;
using PortfolioApi.Data;
using PortfolioApi.Models;

namespace PortfolioApi.Controllers;

[Route("api/guides")]
public class GuidesController : OrderedCrudController<Guide>
{
    public GuidesController(AppDbContext db) : base(db) { }
}
