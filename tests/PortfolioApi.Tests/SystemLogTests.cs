// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using PortfolioApi.Data;
using PortfolioApi.Models;
using PortfolioApi.Services.SystemLog;

namespace PortfolioApi.Tests;

/// <summary>
/// The admin's System log: one row per distinct problem, nothing private stored, the table
/// kept small, only warnings and worse captured, and the admin-only endpoints working.
/// </summary>
public class SystemLogTests : IClassFixture<TestApiFactory>
{
    private readonly TestApiFactory _factory;
    public SystemLogTests(TestApiFactory factory) => _factory = factory;

    private static AppDbContext NewDb() =>
        new(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase($"log-{Guid.NewGuid()}").Options);

    private static LogEvent Event(string message, string template = "Gemini model {Model} returned {Status}",
        DateTime? time = null, string level = "Warning", string source = "PortfolioApi.Services.Gemini.GeminiClient") =>
        new(level, source, template, message, null, null, time ?? DateTime.UtcNow);

    [Fact]
    public async Task Repeats_of_one_problem_are_one_row_with_a_count()
    {
        await using var db = NewDb();
        var start = new DateTime(2026, 11, 1, 8, 0, 0, DateTimeKind.Utc);

        await SystemLogStore.SaveAsync(db, [Event("returned 429", time: start), Event("returned 429", time: start.AddMinutes(1))], default);
        await SystemLogStore.SaveAsync(db, [Event("returned 503", time: start.AddMinutes(5))], default);

        var row = Assert.Single(await db.SystemLog.ToListAsync());
        Assert.Equal(3, row.Count);
        Assert.Equal(start, row.FirstSeen);
        Assert.Equal(start.AddMinutes(5), row.LastSeen);
        Assert.Equal("returned 503", row.Message); // the latest message is shown
    }

    [Fact]
    public async Task Different_problems_get_their_own_rows()
    {
        await using var db = NewDb();
        await SystemLogStore.SaveAsync(db,
        [
            Event("a", template: "First problem"),
            Event("b", template: "Second problem"),
            Event("a", template: "First problem", level: "Error"),
            Event("a", template: "First problem", source: "Other.Source"),
        ], default);

        Assert.Equal(4, await db.SystemLog.CountAsync());
    }

    [Fact]
    public async Task A_resolved_problem_that_happens_again_is_reopened()
    {
        await using var db = NewDb();
        await SystemLogStore.SaveAsync(db, [Event("once")], default);
        (await db.SystemLog.SingleAsync()).Resolved = true;
        await db.SaveChangesAsync();

        await SystemLogStore.SaveAsync(db, [Event("again")], default);

        var row = await db.SystemLog.SingleAsync();
        Assert.False(row.Resolved);
        Assert.Equal(2, row.Count);
    }

    [Theory]
    [InlineData("Failed for visitor@example.com", "Failed for [email]")]
    [InlineData("Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abc-DEF_123 rejected", "Bearer [token] rejected")]
    [InlineData("GET https://api.example.com/v1?key=AIzaSecret123&alt=sse", "GET https://api.example.com/v1?key=[hidden]&alt=sse")]
    [InlineData("Host=db;Password=hunter2;Database=x", "Host=db;Password=[hidden];Database=x")]
    public void Private_details_are_masked(string message, string expected)
    {
        Assert.Equal(expected, SystemLogStore.Redact(message));
    }

    [Fact]
    public async Task Long_messages_and_stack_traces_are_shortened()
    {
        await using var db = NewDb();
        var huge = new string('x', 10_000);
        await SystemLogStore.SaveAsync(db,
            [new LogEvent("Error", "Src", "T", huge, "System.Exception", huge, DateTime.UtcNow)], default);

        var row = await db.SystemLog.SingleAsync();
        Assert.Equal(SystemLogEntry.MaxMessage, row.Message.Length);
        Assert.Equal(SystemLogEntry.MaxStackTrace, row.StackTrace!.Length);
    }

    [Fact]
    public async Task Clean_up_drops_old_resolved_problems_and_keeps_open_ones()
    {
        await using var db = NewDb();
        var now = new DateTime(2026, 12, 31, 0, 0, 0, DateTimeKind.Utc);
        SystemLogEntry Row(string print, int daysAgo, bool resolved) => new()
        {
            Fingerprint = print, Level = "Warning", Source = "S", Message = print,
            FirstSeen = now.AddDays(-daysAgo), LastSeen = now.AddDays(-daysAgo), Resolved = resolved,
        };
        db.SystemLog.AddRange(
            Row("old-resolved", 40, true),
            Row("old-open", 40, false),
            Row("recent-resolved", 5, true));
        await db.SaveChangesAsync();

        await SystemLogStore.CleanUpAsync(db, now, default);

        Assert.Equal(["old-open", "recent-resolved"],
            (await db.SystemLog.Select(e => e.Fingerprint).ToListAsync()).Order());
    }

    [Fact]
    public async Task Clean_up_caps_the_table_by_dropping_the_oldest()
    {
        await using var db = NewDb();
        var now = DateTime.UtcNow;
        for (var i = 0; i < SystemLogStore.MaxRows + 5; i++)
            db.SystemLog.Add(new SystemLogEntry
            {
                Fingerprint = $"p{i}", Level = "Warning", Source = "S", Message = "m",
                FirstSeen = now.AddMinutes(i), LastSeen = now.AddMinutes(i),
            });
        await db.SaveChangesAsync();

        await SystemLogStore.CleanUpAsync(db, now, default);

        Assert.Equal(SystemLogStore.MaxRows, await db.SystemLog.CountAsync());
        Assert.False(await db.SystemLog.AnyAsync(e => e.Fingerprint == "p0")); // the oldest went
    }

    [Fact]
    public void Only_warnings_and_worse_are_captured_and_its_own_logs_never()
    {
        var queue = new SystemLogQueue();
        var provider = new SystemLogProvider(queue);
        var gemini = provider.CreateLogger("PortfolioApi.Services.Gemini.GeminiClient");

        Assert.False(gemini.IsEnabled(LogLevel.Information));
        Assert.True(gemini.IsEnabled(LogLevel.Warning));
        Assert.True(gemini.IsEnabled(LogLevel.Critical));
        Assert.False(provider.CreateLogger("PortfolioApi.Services.SystemLog.SystemLogWriter").IsEnabled(LogLevel.Error));
        Assert.False(provider.CreateLogger("Microsoft.EntityFrameworkCore.Database.Command").IsEnabled(LogLevel.Error));

        gemini.LogWarning("Gemini model {Model} returned {Status}", "flash", 429);
        Assert.True(queue.Reader.TryRead(out var captured));
        Assert.Equal("Gemini model {Model} returned {Status}", captured.Template);
        Assert.Equal("Gemini model flash returned 429", captured.Message);
    }

    private HttpClient Admin()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestApiFactory.Token(TestApiFactory.AdminEmail));
        return client;
    }

    private async Task<JsonElement?> FindInLog(string text)
    {
        var all = await Admin().GetFromJsonAsync<JsonElement>("/api/system-log");
        return all.EnumerateArray()
            .Where(e => e.GetProperty("message").GetString()!.Contains(text))
            .Select(e => (JsonElement?)e).FirstOrDefault();
    }

    [Fact]
    public async Task A_logged_warning_shows_up_in_the_admin_and_can_be_resolved_and_deleted()
    {
        var marker = $"Test problem {Guid.NewGuid():N}";
        var logger = _factory.Services.GetRequiredService<ILoggerFactory>().CreateLogger("PortfolioApi.Tests.Probe");
        logger.LogWarning("{Marker} happened", marker);

        // The writer saves in the background; give it a moment.
        JsonElement? row = null;
        for (var i = 0; i < 50 && row is null; i++)
        {
            await Task.Delay(100);
            row = await FindInLog(marker);
        }
        Assert.NotNull(row);
        var id = row.Value.GetProperty("id").GetInt32();
        Assert.Equal("Warning", row.Value.GetProperty("level").GetString());

        var patched = await Admin().PatchAsJsonAsync($"/api/system-log/{id}", new { resolved = true });
        Assert.Equal(HttpStatusCode.NoContent, patched.StatusCode);
        Assert.True((await FindInLog(marker))!.Value.GetProperty("resolved").GetBoolean());

        Assert.Equal(HttpStatusCode.NoContent, (await Admin().DeleteAsync("/api/system-log/resolved")).StatusCode);
        Assert.Null(await FindInLog(marker));
    }

    [Fact]
    public async Task Changing_a_missing_entry_is_a_404()
    {
        Assert.Equal(HttpStatusCode.NotFound,
            (await Admin().PatchAsJsonAsync("/api/system-log/999999", new { resolved = true })).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await Admin().DeleteAsync("/api/system-log/999999")).StatusCode);
    }
}
