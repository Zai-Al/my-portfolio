// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using System.ComponentModel.DataAnnotations;

namespace PortfolioApi.Models;

/// <summary>
/// One distinct problem the API logged (Warning or worse), shown in the admin's System log.
/// The same problem again only bumps <see cref="Count"/> and <see cref="LastSeen"/>, so the
/// table stays small. Never holds request bodies, visitor questions or email addresses.
/// </summary>
public class SystemLogEntry
{
    public const int MaxMessage = 500;
    public const int MaxStackTrace = 4000;

    public int Id { get; set; }
    /// <summary>Groups repeats: a hash of level, source, message template and exception type.</summary>
    [Required, MaxLength(64)] public string Fingerprint { get; set; } = "";
    /// <summary>"Warning", "Error" or "Critical".</summary>
    [Required, MaxLength(16)] public string Level { get; set; } = "";
    /// <summary>Where it was logged, e.g. "PortfolioApi.Services.Gemini.GeminiClient".</summary>
    [Required, MaxLength(200)] public string Source { get; set; } = "";
    /// <summary>The latest occurrence's message.</summary>
    [Required, MaxLength(MaxMessage)] public string Message { get; set; } = "";
    [MaxLength(200)] public string? ExceptionType { get; set; }
    [MaxLength(MaxStackTrace)] public string? StackTrace { get; set; }
    public int Count { get; set; } = 1;
    public DateTime FirstSeen { get; set; }
    public DateTime LastSeen { get; set; }
    /// <summary>Marked as dealt with in the admin. Happening again reopens it.</summary>
    public bool Resolved { get; set; }
}
