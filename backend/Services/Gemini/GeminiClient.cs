// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using System.Net;
using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using PortfolioApi.Models;

namespace PortfolioApi.Services.Gemini;

/// <summary>
/// Gemini over the generativelanguage REST API: streamGenerateContent (as Server-Sent
/// Events) for answers, batchEmbedContents for embeddings. Registered as a typed
/// HttpClient, so connections are pooled and reused. The key goes in a header, never in
/// the URL, so it can't end up in request logs.
/// </summary>
public class GeminiClient : IGeminiClient
{
    public const string BaseUrl = "https://generativelanguage.googleapis.com/v1beta/models";

    private readonly HttpClient _http;
    private readonly GeminiOptions _options;
    private readonly ILogger<GeminiClient> _logger;

    public GeminiClient(HttpClient http, IOptions<GeminiOptions> options, ILogger<GeminiClient> logger)
    {
        _http = http;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<GeminiStream> StreamAsync(string systemInstruction, IReadOnlyList<GeminiTurn> contents,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_options.ApiKey)) return new(GeminiOutcome.NotConfigured, Empty());

        var body = new
        {
            systemInstruction = new { parts = new[] { new { text = systemInstruction } } },
            contents = contents.Select(c => new { role = c.Role, parts = new[] { new { text = c.Text } } }),
            // Low temperature: stick to the facts in the context instead of being creative.
            generationConfig = new { temperature = 0.2, maxOutputTokens = 600 },
        };
        var json = JsonSerializer.Serialize(body);

        var outcome = GeminiOutcome.Failed;
        foreach (var model in new[] { _options.Model, _options.FallbackModel }.Distinct())
        {
            HttpResponseMessage? response = null;
            try
            {
                using var request = NewRequest($"{BaseUrl}/{model}:streamGenerateContent?alt=sse", json);
                // ResponseHeadersRead: hand back the stream as soon as Gemini starts answering.
                response = await _http.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
                if (response.IsSuccessStatusCode)
                    return new(GeminiOutcome.Ok, ReadSse(response, model, cancellationToken));

                _logger.LogWarning("Gemini model {Model} returned {Status}", model, (int)response.StatusCode);
                outcome = ToOutcome(response.StatusCode);
                response.Dispose();
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException && !cancellationToken.IsCancellationRequested)
            {
                _logger.LogWarning(ex, "Gemini model {Model} call failed", model);
                response?.Dispose();
                outcome = GeminiOutcome.Failed;
            }
            // Only busy/rate-limited is worth retrying on the other model.
            if (outcome == GeminiOutcome.Failed) break;
        }
        return new(outcome, Empty());
    }

    public async Task<GeminiEmbeddings> EmbedAsync(IReadOnlyList<string> texts, EmbeddingTask task,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_options.ApiKey)) return new(GeminiOutcome.NotConfigured, []);
        if (texts.Count == 0) return new(GeminiOutcome.Ok, []);

        var model = $"models/{_options.EmbeddingModel}";
        var taskType = task == EmbeddingTask.Query ? "RETRIEVAL_QUERY" : "RETRIEVAL_DOCUMENT";
        var body = new
        {
            requests = texts.Select(t => new
            {
                model,
                content = new { parts = new[] { new { text = t } } },
                taskType,
                outputDimensionality = KnowledgeChunk.EmbeddingDimensions,
            }),
        };

        try
        {
            using var request = NewRequest($"{BaseUrl}/{_options.EmbeddingModel}:batchEmbedContents",
                JsonSerializer.Serialize(body));
            using var response = await _http.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Gemini embeddings returned {Status}", (int)response.StatusCode);
                return new(ToOutcome(response.StatusCode), []);
            }

            var vectors = ParseEmbeddings(await response.Content.ReadAsStringAsync(cancellationToken));
            if (vectors.Count != texts.Count || vectors.Any(v => v.Length != KnowledgeChunk.EmbeddingDimensions))
            {
                _logger.LogWarning("Gemini embeddings came back in an unexpected shape");
                return new(GeminiOutcome.Failed, []);
            }
            return new(GeminiOutcome.Ok, vectors);
        }
        catch (Exception ex) when (ex is HttpRequestException or JsonException or TaskCanceledException && !cancellationToken.IsCancellationRequested)
        {
            _logger.LogWarning(ex, "Gemini embeddings call failed");
            return new(GeminiOutcome.Failed, []);
        }
    }

    private HttpRequestMessage NewRequest(string url, string json)
    {
        var message = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json"),
        };
        message.Headers.Add("x-goog-api-key", _options.ApiKey);
        return message;
    }

    private static GeminiOutcome ToOutcome(HttpStatusCode status) => status switch
    {
        HttpStatusCode.TooManyRequests => GeminiOutcome.QuotaExceeded,
        HttpStatusCode.ServiceUnavailable => GeminiOutcome.Busy,
        _ => GeminiOutcome.Failed,
    };

    private static async IAsyncEnumerable<string> Empty()
    {
        await Task.CompletedTask;
        yield break;
    }

    /// <summary>Reads "data: {...}" lines and yields the text parts as they arrive.</summary>
    private async IAsyncEnumerable<string> ReadSse(HttpResponseMessage response, string model,
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        using (response)
        {
            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var reader = new StreamReader(stream);
            while (await reader.ReadLineAsync(cancellationToken) is { } line)
            {
                if (!line.StartsWith("data:", StringComparison.Ordinal)) continue;
                string? text;
                try { text = ExtractStreamText(line[5..].Trim()); }
                catch (JsonException ex)
                {
                    _logger.LogWarning(ex, "Gemini model {Model} sent an unreadable stream event", model);
                    yield break;
                }
                if (!string.IsNullOrEmpty(text)) yield return text;
            }
        }
    }

    /// <summary>Text from one streamed event: candidates[0].content.parts[*].text (thought parts skipped).</summary>
    internal static string? ExtractStreamText(string json)
    {
        using var doc = JsonDocument.Parse(json);
        if (!doc.RootElement.TryGetProperty("candidates", out var candidates)
            || candidates.ValueKind != JsonValueKind.Array || candidates.GetArrayLength() == 0) return null;
        if (!candidates[0].TryGetProperty("content", out var content)
            || !content.TryGetProperty("parts", out var parts) || parts.ValueKind != JsonValueKind.Array) return null;

        var text = new StringBuilder();
        foreach (var part in parts.EnumerateArray())
        {
            if (part.TryGetProperty("thought", out var thought) && thought.ValueKind == JsonValueKind.True) continue;
            if (part.TryGetProperty("text", out var partText)) text.Append(partText.GetString());
        }
        return text.ToString();
    }

    /// <summary>{ "embeddings": [ { "values": [...] }, ... ] }</summary>
    internal static List<float[]> ParseEmbeddings(string json)
    {
        using var doc = JsonDocument.Parse(json);
        var result = new List<float[]>();
        if (!doc.RootElement.TryGetProperty("embeddings", out var embeddings)) return result;
        foreach (var e in embeddings.EnumerateArray())
        {
            if (!e.TryGetProperty("values", out var values)) return [];
            result.Add(values.EnumerateArray().Select(v => v.GetSingle()).ToArray());
        }
        return result;
    }
}
