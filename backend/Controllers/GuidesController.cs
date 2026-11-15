// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using Microsoft.AspNetCore.Mvc;
using PortfolioApi.Data;
using PortfolioApi.Models;

namespace PortfolioApi.Controllers;

[Route("api/guides")]
public class GuidesController : OrderedCrudController<Guide>
{
    public GuidesController(AppDbContext db) : base(db) { }

    protected override Func<Guide, Guide, bool>? IsDuplicate => (a, b) => Same(a.Title, b.Title);

    protected override string DuplicateMessage(Guide candidate, Guide existing) =>
        $"A chatbot guide with the question \"{existing.Title}\" already exists.";
}
