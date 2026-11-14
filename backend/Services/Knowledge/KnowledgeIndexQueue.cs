// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using System.Threading.Channels;

namespace PortfolioApi.Services.Knowledge;

/// <summary>
/// "Please rebuild the AI knowledge" requests, plus what the last rebuild did (shown in
/// the admin portal). Holds at most one pending request: ten admin saves in a row cause
/// one rebuild, not ten. Singleton.
/// </summary>
public class KnowledgeIndexQueue
{
    private readonly Channel<bool> _channel = Channel.CreateBounded<bool>(
        new BoundedChannelOptions(1) { FullMode = BoundedChannelFullMode.DropWrite, SingleReader = true });
    private readonly object _lock = new();
    private KnowledgeIndexStatus _status = new("idle", null, null, null);

    public ChannelReader<bool> Reader => _channel.Reader;

    /// <summary>Asks for a rebuild. Returns immediately; the background worker does the work.</summary>
    public void Request()
    {
        if (_channel.Writer.TryWrite(true))
            lock (_lock) if (_status.State == "idle") _status = _status with { State = "queued" };
    }

    public KnowledgeIndexStatus Status { get { lock (_lock) return _status; } }

    internal void MarkRunning() { lock (_lock) _status = _status with { State = "running", LastStartedAt = DateTime.UtcNow }; }

    internal void MarkFinished(string message)
    {
        lock (_lock)
            _status = _status with
            {
                // Another request may have arrived while this one ran.
                State = _channel.Reader.Count > 0 ? "queued" : "idle",
                LastFinishedAt = DateTime.UtcNow,
                LastMessage = message,
            };
    }
}

/// <summary>State is "idle", "queued" or "running". LastMessage says what the last rebuild did.</summary>
public record KnowledgeIndexStatus(string State, DateTime? LastStartedAt, DateTime? LastFinishedAt, string? LastMessage);
