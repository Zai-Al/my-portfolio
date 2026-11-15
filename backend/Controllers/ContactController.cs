// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using PortfolioApi.Data;
using PortfolioApi.Models;

namespace PortfolioApi.Controllers;

[ApiController]
[Route("api/contact")]
public class ContactController : ControllerBase
{
    private readonly AppDbContext _db;
    public ContactController(AppDbContext db) => _db = db;

    /// <summary>What a visitor may send. Website is a honeypot: hidden from people, filled by bots.</summary>
    public record ContactRequest(
        [Required, MaxLength(100)] string Name,
        [Required, EmailAddress, MaxLength(200)] string Email,
        [MaxLength(200)] string? Subject,
        [Required, MaxLength(5000)] string Message,
        string? Website);

    // Public - anyone can send a message via the contact form. Rate limited per IP.
    [HttpPost]
    [AllowAnonymous]
    [EnableRateLimiting("contact")]
    public async Task<IActionResult> Send(ContactRequest request)
    {
        // Bot filled the hidden field: pretend it worked, store nothing.
        if (!string.IsNullOrWhiteSpace(request.Website))
            return Ok(new { status = "received" });

        _db.ContactMessages.Add(new ContactMessage
        {
            Name = request.Name.Trim(),
            Email = request.Email.Trim(),
            Subject = string.IsNullOrWhiteSpace(request.Subject) ? null : request.Subject.Trim(),
            Message = request.Message.Trim(),
            ReceivedAt = DateTime.UtcNow,
            Read = false,
        });
        await _db.SaveChangesAsync();
        return Ok(new { status = "received" });
    }

    // Protected - only you can read the inbox, from the admin panel.
    [HttpGet]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.ContactMessages.OrderByDescending(m => m.ReceivedAt).ToListAsync());

    public record MarkReadRequest(bool Read);

    // Protected - toggle read/unread from the admin inbox.
    [HttpPatch("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> MarkRead(int id, MarkReadRequest request)
    {
        var existing = await _db.ContactMessages.FindAsync(id);
        if (existing is null) return NotFound();
        existing.Read = request.Read;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // Protected - remove a message from the admin inbox.
    [HttpDelete("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Delete(int id)
    {
        var existing = await _db.ContactMessages.FindAsync(id);
        if (existing is null) return NotFound();
        _db.ContactMessages.Remove(existing);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
