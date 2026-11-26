// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using PortfolioApi.Data;

namespace PortfolioApi.Services.SystemLog;

/// <summary>
/// Saves queued problems to the System log in small batches, and cleans the table up soon
/// after start and then every few hours. Runs in the background, so logging never waits on
/// the database; if saving fails, those entries are dropped (and noted on the console only,
/// since logging it would feed straight back into this queue).
/// </summary>
public sealed class SystemLogWriter(SystemLogQueue queue, IServiceScopeFactory scopes) : BackgroundService
{
    public const int BatchSize = 100;
    public static readonly TimeSpan CleanUpEvery = TimeSpan.FromHours(6);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var nextCleanUp = DateTime.UtcNow.AddMinutes(1);
        while (!stoppingToken.IsCancellationRequested)
        {
            var batch = new List<LogEvent>();
            try
            {
                // Wake up for new entries, or when the next clean-up is due.
                var untilCleanUp = nextCleanUp - DateTime.UtcNow;
                var waitForEntries = queue.Reader.WaitToReadAsync(stoppingToken).AsTask();
                if (untilCleanUp > TimeSpan.Zero)
                    await Task.WhenAny(waitForEntries, Task.Delay(untilCleanUp, stoppingToken));
                while (batch.Count < BatchSize && queue.Reader.TryRead(out var entry)) batch.Add(entry);

                using var scope = scopes.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                if (batch.Count > 0) await SystemLogStore.SaveAsync(db, batch, stoppingToken);
                if (DateTime.UtcNow >= nextCleanUp)
                {
                    nextCleanUp = DateTime.UtcNow + CleanUpEvery;
                    await SystemLogStore.CleanUpAsync(db, DateTime.UtcNow, stoppingToken);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine(
                    $"System log: couldn't save {batch.Count} entries ({ex.GetType().Name}: {ex.Message})");
                // Don't spin on a database that's down.
                try { await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken); }
                catch (OperationCanceledException) { return; }
            }
        }
    }
}
