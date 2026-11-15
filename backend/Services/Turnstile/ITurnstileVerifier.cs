// Copyright (c) 2026 Zainab Alawi. All rights reserved.

namespace PortfolioApi.Services.Turnstile;

/// <summary>Checks a Cloudflare Turnstile token: did a real browser pass the challenge?</summary>
public interface ITurnstileVerifier
{
    /// <param name="token">The token the widget gave the browser (single use, valid 5 minutes).</param>
    /// <param name="expectedAction">Must match the widget's action, so a token made for one thing can't unlock another.</param>
    /// <param name="remoteIp">The visitor's IP, passed on to Cloudflare as an extra signal.</param>
    Task<bool> VerifyAsync(string token, string expectedAction, string? remoteIp, CancellationToken ct = default);
}
