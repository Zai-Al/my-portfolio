// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;

namespace PortfolioApi.Services.Turnstile;

/// <summary>Asks Cloudflare's siteverify endpoint whether a Turnstile token is genuine.</summary>
public class TurnstileVerifier : ITurnstileVerifier
{
    private const string SiteVerifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

    private readonly HttpClient _http;
    private readonly TurnstileOptions _options;
    private readonly ILogger<TurnstileVerifier> _logger;

    public TurnstileVerifier(HttpClient http, IOptions<TurnstileOptions> options, ILogger<TurnstileVerifier> logger)
    {
        _http = http;
        _options = options.Value;
        _logger = logger;
    }

    private record SiteVerifyResponse(
        [property: JsonPropertyName("success")] bool Success,
        [property: JsonPropertyName("action")] string? Action,
        [property: JsonPropertyName("error-codes")] string[]? ErrorCodes);

    public async Task<bool> VerifyAsync(string token, string expectedAction, string? remoteIp, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_options.SecretKey))
        {
            _logger.LogWarning("Turnstile:SecretKey is not set; refusing the check.");
            return false;
        }

        var form = new Dictionary<string, string> { ["secret"] = _options.SecretKey, ["response"] = token };
        if (!string.IsNullOrEmpty(remoteIp)) form["remoteip"] = remoteIp;

        try
        {
            using var response = await _http.PostAsync(SiteVerifyUrl, new FormUrlEncodedContent(form), ct);
            if (!response.IsSuccessStatusCode) return false;
            var result = await response.Content.ReadFromJsonAsync<SiteVerifyResponse>(ct);
            if (result is null || !result.Success)
            {
                _logger.LogInformation("Turnstile check failed: {Errors}", string.Join(",", result?.ErrorCodes ?? []));
                return false;
            }
            // Cloudflare's test keys (local dev) return no action; real tokens always carry one.
            return string.IsNullOrEmpty(result.Action) || result.Action == expectedAction;
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or System.Text.Json.JsonException)
        {
            _logger.LogWarning(ex, "Couldn't reach Cloudflare Turnstile.");
            return false;
        }
    }
}
