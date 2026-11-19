// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using PortfolioApi.Services.Gemini;
using PortfolioApi.Services.Translation;

namespace PortfolioApi.Controllers;

/// <summary>English texts to translate, by field name, e.g. { "role": "Intern", "bullets": ["…"] }.</summary>
public record TranslateRequest([Required] Dictionary<string, JsonElement> Fields);

/// <summary>
/// The admin portal's "translate to Arabic" button: Gemini (free tier, the AI guide's key)
/// translates the English fields of the form being edited. Nothing is saved here: the
/// translations go back into the form, so they can be checked before saving.
/// Replies { fields: { role: "…", bullets: ["…"] } }; 503 (problem details) when the AI is unavailable.
/// </summary>
[ApiController]
[Route("api/translate")]
[Authorize(Policy = "AdminOnly")]
public partial class TranslateController : ControllerBase
{
    public const int MaxFields = 40;
    public const int MaxTotalLength = 20_000;

    private readonly IGeminiClient _gemini;
    public TranslateController(IGeminiClient gemini) => _gemini = gemini;

    [GeneratedRegex("^[A-Za-z][A-Za-z0-9]{0,39}$")]
    private static partial Regex FieldName();

    [HttpPost]
    [EnableRateLimiting("translate")]
    public async Task<IActionResult> Translate(TranslateRequest request, CancellationToken cancellationToken)
    {
        var fields = request.Fields;
        if (fields.Count is 0 or > MaxFields)
            return ValidationProblem($"Send 1 to {MaxFields} fields.");

        var total = 0;
        foreach (var (key, value) in fields)
        {
            if (!FieldName().IsMatch(key)) return ValidationProblem($"\"{key}\" isn't a field name.");
            if (value.ValueKind == JsonValueKind.String)
                total += value.GetString()!.Length;
            else if (value.ValueKind == JsonValueKind.Array && value.EnumerateArray().All(i => i.ValueKind == JsonValueKind.String))
                total += value.EnumerateArray().Sum(i => i.GetString()!.Length);
            else
                return ValidationProblem($"\"{key}\" must be a text or a list of texts.");
        }
        if (total > MaxTotalLength)
            return ValidationProblem($"Too much text to translate at once (over {MaxTotalLength} characters).");

        var reply = await _gemini.GenerateJsonAsync(TranslatePrompt.System, JsonSerializer.Serialize(fields), cancellationToken);
        if (reply.Outcome != GeminiOutcome.Ok)
            return Problem(detail: Unavailable(reply.Outcome), statusCode: StatusCodes.Status503ServiceUnavailable);

        var translated = TranslatePrompt.ReadResult(fields, reply.Text);
        if (translated.Count == 0)
            return Problem(detail: "The AI's translation couldn't be read. Try again.",
                statusCode: StatusCodes.Status502BadGateway);
        return Ok(new { fields = translated });
    }

    private static string Unavailable(GeminiOutcome outcome) => outcome switch
    {
        GeminiOutcome.NotConfigured => "Translation needs the Gemini API key (Gemini:ApiKey).",
        GeminiOutcome.QuotaExceeded => "Gemini's free quota is used up for now. Try again later, or type the Arabic yourself.",
        GeminiOutcome.Busy => "Gemini is busy right now. Try again in a minute.",
        _ => "The translation failed. Try again in a moment.",
    };
}
