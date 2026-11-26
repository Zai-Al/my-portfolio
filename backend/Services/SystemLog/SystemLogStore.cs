// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using PortfolioApi.Data;
using PortfolioApi.Models;

namespace PortfolioApi.Services.SystemLog;

/// <summary>Saving logged problems (one row per distinct problem) and keeping the table small.</summary>
public static partial class SystemLogStore
{
    /// <summary>Hard cap on rows: past it, the problems that happened longest ago go first.</summary>
    public const int MaxRows = 1000;

    /// <summary>Resolved problems are deleted once this long has passed since they last happened.</summary>
    public static readonly TimeSpan KeepResolved = TimeSpan.FromDays(30);

    /// <summary>Adds new problems and counts repeats of known ones. A repeat reopens a resolved problem.</summary>
    public static async Task SaveAsync(AppDbContext db, IReadOnlyList<LogEvent> events, CancellationToken ct)
    {
        var groups = events.GroupBy(Fingerprint).ToList();
        var prints = groups.Select(g => g.Key).ToList();
        var existing = await db.SystemLog.Where(e => prints.Contains(e.Fingerprint))
            .ToDictionaryAsync(e => e.Fingerprint, ct);

        foreach (var group in groups)
        {
            var latest = group.MaxBy(e => e.Time)!;
            if (existing.TryGetValue(group.Key, out var row))
            {
                row.Count += group.Count();
                row.LastSeen = latest.Time;
                row.Message = CleanMessage(latest.Message);
                row.StackTrace = CleanStackTrace(latest.StackTrace);
                row.Resolved = false;
                continue;
            }
            db.SystemLog.Add(new SystemLogEntry
            {
                Fingerprint = group.Key,
                Level = latest.Level,
                Source = Trim(latest.Source, 200),
                Message = CleanMessage(latest.Message),
                ExceptionType = latest.ExceptionType is null ? null : Trim(latest.ExceptionType, 200),
                StackTrace = CleanStackTrace(latest.StackTrace),
                Count = group.Count(),
                FirstSeen = group.Min(e => e.Time),
                LastSeen = latest.Time,
            });
        }
        await db.SaveChangesAsync(ct);
    }

    /// <summary>Deletes resolved problems older than <see cref="KeepResolved"/>, then enforces <see cref="MaxRows"/>.</summary>
    public static async Task CleanUpAsync(AppDbContext db, DateTime now, CancellationToken ct)
    {
        var cutoff = now - KeepResolved;
        db.SystemLog.RemoveRange(
            await db.SystemLog.Where(e => e.Resolved && e.LastSeen < cutoff).ToListAsync(ct));
        await db.SaveChangesAsync(ct);

        var extra = await db.SystemLog.CountAsync(ct) - MaxRows;
        if (extra <= 0) return;
        db.SystemLog.RemoveRange(
            await db.SystemLog.OrderBy(e => e.LastSeen).Take(extra).ToListAsync(ct));
        await db.SaveChangesAsync(ct);
    }

    /// <summary>Same level, source, message template and exception type = the same problem.</summary>
    public static string Fingerprint(LogEvent e)
    {
        var key = $"{e.Level}|{e.Source}|{e.Template}|{e.ExceptionType}";
        return Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(key)));
    }

    /// <summary>
    /// Takes out anything private that a message might carry (email addresses, sign-in
    /// tokens, keys or passwords in a URL or connection string), then shortens it.
    /// </summary>
    public static string Redact(string text) =>
        Secret().Replace(Jwt().Replace(Email().Replace(text, "[email]"), "[token]"), "$1=[hidden]");

    public static string CleanMessage(string message) => Trim(Redact(message), SystemLogEntry.MaxMessage);

    public static string? CleanStackTrace(string? stack) =>
        stack is null ? null : Trim(Redact(stack), SystemLogEntry.MaxStackTrace);

    private static string Trim(string text, int max) => text.Length <= max ? text : text[..(max - 1)] + "…";

    [GeneratedRegex(@"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")]
    private static partial Regex Email();

    [GeneratedRegex(@"eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+")]
    private static partial Regex Jwt();

    [GeneratedRegex(@"(?i)\b(key|api_?key|token|secret|password|pwd)=[^&;\s]+")]
    private static partial Regex Secret();
}
