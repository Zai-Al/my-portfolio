// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PortfolioApi.Data;
using PortfolioApi.Models;

namespace PortfolioApi.Controllers;

[ApiController]
[Route("api/site-settings")]
public class SiteSettingsController : ControllerBase
{
    private readonly AppDbContext _db;
    public SiteSettingsController(AppDbContext db) => _db = db;

    // Public - profile content shown on the site and used as AI context.
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> Get() =>
        Ok(await _db.SiteSettings.FindAsync(1) ?? new SiteSettings { Id = 1 });

    // Protected - only the admin panel can change it.
    [HttpPut]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Update(SiteSettings updated)
    {
        updated.Id = 1;
        var existing = await _db.SiteSettings.FindAsync(1);
        if (existing is null)
            _db.SiteSettings.Add(updated);
        else
            _db.Entry(existing).CurrentValues.SetValues(updated);

        await _db.SaveChangesAsync();
        return Ok(existing ?? updated);
    }
}
