// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using Microsoft.Extensions.Options;

namespace PortfolioApi.Services.Knowledge;

/// <summary>
/// Runs knowledge rebuilds in the background, one at a time, so an admin save never waits
/// for Gemini. Requests come from <see cref="KnowledgeIndexQueue"/> (admin saves, the
/// "Rebuild AI knowledge" button, and once at startup).
/// </summary>
public class KnowledgeIndexWorker : BackgroundService
{
    private readonly KnowledgeIndexQueue _queue;
    private readonly IServiceScopeFactory _scopes;
    private readonly KnowledgeOptions _options;
    private readonly ILogger<KnowledgeIndexWorker> _logger;

    public KnowledgeIndexWorker(KnowledgeIndexQueue queue, IServiceScopeFactory scopes,
        IOptions<KnowledgeOptions> options, ILogger<KnowledgeIndexWorker> logger)
    {
        _queue = queue;
        _scopes = scopes;
        _options = options.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (_options.RebuildOnStartup) _queue.Request();

        while (await _queue.Reader.WaitToReadAsync(stoppingToken))
        {
            // Let a burst of saves settle, then take the request (later ones queue a new run).
            await Task.Delay(TimeSpan.FromSeconds(Math.Max(0, _options.DebounceSeconds)), stoppingToken);
            _queue.Reader.TryRead(out _);
            _queue.MarkRunning();

            string message;
            try
            {
                using var scope = _scopes.CreateScope();
                var indexer = scope.ServiceProvider.GetRequiredService<KnowledgeIndexer>();
                message = await indexer.RebuildAsync(stoppingToken);
                _logger.LogInformation("Knowledge rebuilt: {Summary}", message);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Knowledge rebuild failed");
                message = "The last rebuild failed (see the API logs). Try again in a minute.";
            }
            _queue.MarkFinished(message);
        }
    }
}
