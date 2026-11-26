// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortfolioApi.Data;

namespace PortfolioApi.Controllers;

/// <summary>The admin's System log: problems the API logged, one row per distinct problem. Admin only.</summary>
[ApiController]
[Route("api/system-log")]
[Authorize(Policy = "AdminOnly")]
public class SystemLogController : ControllerBase
{
    private readonly AppDbContext _db;
    public SystemLogController(AppDbContext db) => _db = db;

    // Open problems first, then the most recent.
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _db.SystemLog.AsNoTracking()
            .OrderBy(e => e.Resolved).ThenByDescending(e => e.LastSeen)
            .ToListAsync());

    public record MarkResolvedRequest(bool Resolved);

    [HttpPatch("{id}")]
    public async Task<IActionResult> MarkResolved(int id, MarkResolvedRequest request)
    {
        var existing = await _db.SystemLog.FindAsync(id);
        if (existing is null) return NotFound();
        existing.Resolved = request.Resolved;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var existing = await _db.SystemLog.FindAsync(id);
        if (existing is null) return NotFound();
        _db.SystemLog.Remove(existing);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // "Clear resolved": removes every problem marked as dealt with.
    [HttpDelete("resolved")]
    public async Task<IActionResult> DeleteResolved()
    {
        _db.SystemLog.RemoveRange(await _db.SystemLog.Where(e => e.Resolved).ToListAsync());
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
