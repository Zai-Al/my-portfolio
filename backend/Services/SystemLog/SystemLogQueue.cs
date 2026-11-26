// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using System.Threading.Channels;

namespace PortfolioApi.Services.SystemLog;

/// <summary>One logged problem on its way to the System log table.</summary>
public record LogEvent(
    string Level,
    string Source,
    /// <summary>The message before values were filled in ("Gemini model {Model} returned {Status}"), for grouping.</summary>
    string Template,
    string Message,
    string? ExceptionType,
    string? StackTrace,
    DateTime Time);

/// <summary>
/// Hands logged problems from the logger (any thread, inside requests) to the background
/// writer. Bounded: if the writer falls behind (the database is down), new entries are
/// dropped instead of using up memory or slowing anything down.
/// </summary>
public sealed class SystemLogQueue
{
    public const int Capacity = 500;

    private readonly Channel<LogEvent> _channel = Channel.CreateBounded<LogEvent>(
        new BoundedChannelOptions(Capacity) { FullMode = BoundedChannelFullMode.DropWrite, SingleReader = true });

    /// <summary>Never waits: a full queue just drops the entry.</summary>
    public void Add(LogEvent entry) => _channel.Writer.TryWrite(entry);

    public ChannelReader<LogEvent> Reader => _channel.Reader;
}
