// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using PortfolioApi.Data;
using PortfolioApi.Services.Gemini;
using PortfolioApi.Services.Knowledge;

namespace PortfolioApi.Controllers;

/// <summary>An earlier message in the chat. Role is "user" or "assistant".</summary>
public record AskTurn([Required, RegularExpression("^(user|assistant)$")] string Role,
    [Required, MaxLength(AskController.MaxTurnLength)] string Text);

/// <summary>A visitor's question, with the last few turns so follow-ups ("and its tech stack?") make sense.</summary>
public record AskRequest(
    [Required, MaxLength(AskController.MaxQuestionLength)] string Question,
    [MaxLength(AskController.MaxHistoryTurns)] List<AskTurn>? History);

/// <summary>
/// The AI guide (chat widget and terminal). Retrieves the most relevant site content,
/// then streams Gemini's answer back as Server-Sent Events:
///   data: {"type":"delta","text":"..."}            (repeated, as the answer is written)
///   data: {"type":"sources","sources":[{type,title,anchor}]}
///   data: {"type":"done"}
/// or {"type":"error","message":"..."} if Gemini fails mid-answer. Problems before the
/// answer starts are plain JSON errors instead: 400 (bad input), 429 (rate limit),
/// 503 { message } (AI unavailable).
/// </summary>
[ApiController]
[Route("api/ask")]
public class AskController : ControllerBase
{
    public const int MaxQuestionLength = 500;
    public const int MaxTurnLength = 2000;
    public const int MaxHistoryTurns = 6;

    private static readonly JsonSerializerOptions Json = JsonSerializerOptions.Web;

    private readonly IGeminiClient _gemini;
    private readonly KnowledgeRetriever _retriever;
    private readonly AppDbContext _db;
    private readonly ILogger<AskController> _logger;

    public AskController(IGeminiClient gemini, KnowledgeRetriever retriever, AppDbContext db, ILogger<AskController> logger)
    {
        _gemini = gemini;
        _retriever = retriever;
        _db = db;
        _logger = logger;
    }

    // Public, but rate limited per visitor (see the "ask" policy in Program.cs).
    [HttpPost]
    [EnableRateLimiting("ask")]
    public async Task Ask(AskRequest request, CancellationToken cancellationToken)
    {
        var question = request.Question.Trim();
        var history = (request.History ?? []).TakeLast(MaxHistoryTurns).ToList();

        // Follow-ups like "what tech did it use?" only make sense with the previous question.
        var lastUserTurn = history.LastOrDefault(t => t.Role == "user")?.Text;
        var searchText = lastUserTurn is null ? question : $"{lastUserTurn}\n{question}";
        var context = await _retriever.RetrieveAsync(searchText[..Math.Min(searchText.Length, 1500)], cancellationToken);

        var ownerName = await _db.SiteSettings.AsNoTracking().Where(s => s.Id == 1)
            .Select(s => s.FullName).FirstOrDefaultAsync(cancellationToken);
        var system = AskPrompt.Build(ownerName, context);

        var contents = history
            .Select(t => new GeminiTurn(t.Role == "assistant" ? "model" : "user", t.Text))
            .Append(new GeminiTurn("user", question))
            .ToList();

        var stream = await _gemini.StreamAsync(system, contents, cancellationToken);
        if (stream.Outcome != GeminiOutcome.Ok)
        {
            Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
            await Response.WriteAsJsonAsync(new { message = Unavailable(stream.Outcome) }, cancellationToken);
            return;
        }

        Response.ContentType = "text/event-stream";
        Response.Headers.CacheControl = "no-cache";
        Response.Headers["X-Accel-Buffering"] = "no"; // ask proxies not to hold the stream back
        HttpContext.Features.Get<IHttpResponseBodyFeature>()?.DisableBuffering();

        var filter = new CitationFilter();
        try
        {
            await foreach (var piece in stream.Chunks.WithCancellation(cancellationToken))
            {
                var text = filter.Push(piece);
                if (text.Length > 0) await Send(new { type = "delta", text }, cancellationToken);
            }

            var (rest, cited) = filter.Finish();
            if (rest.Length > 0) await Send(new { type = "delta", text = rest }, cancellationToken);

            var sources = cited
                .Where(n => n <= context.Count)
                .Select(n => context[n - 1])
                .Where(c => c.Anchor is not null)
                .DistinctBy(c => (c.SourceType, c.SourceId))
                .Select(c => new { type = c.SourceType, title = c.Title, anchor = c.Anchor })
                .ToList();
            await Send(new { type = "sources", sources }, cancellationToken);
            await Send(new { type = "done" }, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            // The visitor closed the chat or left the page.
        }
        catch (Exception ex) when (ex is HttpRequestException or IOException or TaskCanceledException)
        {
            _logger.LogWarning(ex, "Gemini stream broke off mid-answer");
            await Send(new { type = "error", message = "The answer was cut off - try asking again." }, CancellationToken.None);
        }
    }

    private async Task Send(object payload, CancellationToken ct)
    {
        await Response.WriteAsync($"data: {JsonSerializer.Serialize(payload, Json)}\n\n", ct);
        await Response.Body.FlushAsync(ct);
    }

    private static string Unavailable(GeminiOutcome outcome) => outcome switch
    {
        GeminiOutcome.NotConfigured => "The AI isn't set up yet.",
        GeminiOutcome.QuotaExceeded =>
            "The AI is resting - it has used up its free quota for now. Try again later, or use the Contact section.",
        GeminiOutcome.Busy => "The AI is very busy right now - try again in a minute.",
        _ => "The AI hit an error - try again in a moment.",
    };
}
