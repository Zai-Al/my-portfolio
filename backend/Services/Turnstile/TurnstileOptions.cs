// Copyright (c) 2026 Zainab Alawi. All rights reserved.

namespace PortfolioApi.Services.Turnstile;

/// <summary>The "Turnstile" config section (user-secrets locally, Turnstile__* env vars on Render).</summary>
public class TurnstileOptions
{
    public const string Section = "Turnstile";

    /// <summary>Cloudflare Turnstile secret key. Unset = every check fails (the email stays hidden).</summary>
    public string? SecretKey { get; set; }
}
