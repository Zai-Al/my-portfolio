// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using PortfolioApi.Data;
using PortfolioApi.Models;
using PortfolioApi.Services.Turnstile;

namespace PortfolioApi.Controllers;

[ApiController]
[Route("api/site-settings")]
public class SiteSettingsController : ControllerBase
{
    /// <summary>The Turnstile widget's action on the site; a token made for anything else is refused.</summary>
    public const string RevealEmailAction = "reveal-email";

    private readonly AppDbContext _db;
    private readonly ITurnstileVerifier _turnstile;

    public SiteSettingsController(AppDbContext db, ITurnstileVerifier turnstile)
    {
        _db = db;
        _turnstile = turnstile;
    }

    private async Task<SiteSettings> LoadAsync() =>
        await _db.SiteSettings.AsNoTracking().FirstOrDefaultAsync(s => s.Id == 1) ?? new SiteSettings { Id = 1 };

    // Public - profile content shown on the site. Email and phone are left out so scrapers
    // can't harvest them: the email is only given by RevealEmail, the phone never.
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> Get()
    {
        var settings = await LoadAsync();
        settings.HasEmail = !string.IsNullOrWhiteSpace(settings.Email);
        settings.Email = null;
        settings.Phone = null;
        return Ok(settings);
    }

    // Protected - everything, for the admin form (saving sends the whole record back, so
    // it must start from the full one or the email and phone would be wiped).
    [HttpGet("full")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> GetFull()
    {
        var settings = await LoadAsync();
        settings.HasEmail = !string.IsNullOrWhiteSpace(settings.Email);
        return Ok(settings);
    }

    public record RevealRequest([Required, MaxLength(2048)] string Token);

    // Public, but only for a browser that passed Cloudflare Turnstile ("Show email" button).
    // Rate limited per IP, and never cached.
    [HttpPost("email")]
    [AllowAnonymous]
    [EnableRateLimiting("reveal")]
    public async Task<IActionResult> RevealEmail(RevealRequest request, CancellationToken ct)
    {
        Response.Headers.CacheControl = "no-store";
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        if (!await _turnstile.VerifyAsync(request.Token, RevealEmailAction, ip, ct))
            return Problem(statusCode: StatusCodes.Status403Forbidden, title: "The spam check failed. Please try again.");

        var email = (await LoadAsync()).Email;
        return string.IsNullOrWhiteSpace(email)
            ? Problem(statusCode: StatusCodes.Status404NotFound, title: "No email address is set.")
            : Ok(new { email });
    }

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
