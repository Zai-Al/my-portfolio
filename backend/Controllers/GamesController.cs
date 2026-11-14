// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using Microsoft.AspNetCore.Mvc;
using PortfolioApi.Data;
using PortfolioApi.Models;

namespace PortfolioApi.Controllers;

[Route("api/games")]
public class GamesController : OrderedCrudController<Game>
{
    public GamesController(AppDbContext db) : base(db) { }
}
