// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortfolioApi.Data;
using PortfolioApi.Services.Knowledge;

namespace PortfolioApi.Controllers;

/// <summary>Admin-only: the AI guide's knowledge (rebuild it, see how it's doing).</summary>
[ApiController]
[Route("api/knowledge")]
[Authorize(Policy = "AdminOnly")]
public class KnowledgeController : ControllerBase
{
    private readonly KnowledgeIndexQueue _queue;
    private readonly AppDbContext _db;

    public KnowledgeController(KnowledgeIndexQueue queue, AppDbContext db)
    {
        _queue = queue;
        _db = db;
    }

    /// <summary>Queues a rebuild and returns at once (202); it runs in the background.</summary>
    [HttpPost("reindex")]
    public IActionResult Reindex()
    {
        _queue.Request();
        return Accepted(_queue.Status);
    }

    [HttpGet("status")]
    public async Task<IActionResult> Status()
    {
        var total = await _db.KnowledgeChunks.CountAsync();
        var embedded = await _db.KnowledgeChunks.CountAsync(c => c.Embedding != null);
        var s = _queue.Status;
        return Ok(new { s.State, s.LastStartedAt, s.LastFinishedAt, s.LastMessage, chunks = total, embedded });
    }
}
