// Copyright (c) 2026 Zainab Alawi. All rights reserved.

namespace PortfolioApi.Services.SystemLog;

/// <summary>
/// Plugs into .NET logging: every Warning, Error or Critical logged anywhere in the API
/// (Gemini failures, Turnstile, the AI index rebuild, unhandled exceptions from ASP.NET's
/// error handler) goes to the System log, without changing the code that logs it.
/// </summary>
public sealed class SystemLogProvider(SystemLogQueue queue) : ILoggerProvider
{
    public ILogger CreateLogger(string categoryName) => new SystemLogLogger(categoryName, queue);

    public void Dispose() { }
}

internal sealed class SystemLogLogger(string category, SystemLogQueue queue) : ILogger
{
    // Never log the System log's own work (saving an entry could log again, in a loop), nor
    // the database driver's: when the database is down they'd only describe the same outage.
    private static readonly string[] IgnoredSources =
        ["PortfolioApi.Services.SystemLog", "Microsoft.EntityFrameworkCore", "Npgsql"];

    private readonly bool _ignored = IgnoredSources.Any(category.StartsWith);

    public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

    public bool IsEnabled(LogLevel logLevel) =>
        !_ignored && logLevel is LogLevel.Warning or LogLevel.Error or LogLevel.Critical;

    public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception,
        Func<TState, Exception?, string> formatter)
    {
        if (!IsEnabled(logLevel)) return;
        var message = formatter(state, exception);
        // Structured messages keep their template; group by that, so "returned 429" and
        // "returned 503" from the same line are one problem with the latest message shown.
        var template = state is IReadOnlyList<KeyValuePair<string, object?>> values
            ? values.FirstOrDefault(v => v.Key == "{OriginalFormat}").Value as string
            : null;
        queue.Add(new LogEvent(
            logLevel.ToString(),
            category,
            template ?? message,
            message,
            exception?.GetType().FullName,
            exception?.ToString(),
            DateTime.UtcNow));
    }
}
