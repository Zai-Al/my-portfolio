// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace PortfolioApi.Services.Knowledge;

/// <summary>
/// Queues a knowledge rebuild whenever a save touches content the chatbot answers from,
/// so every admin edit reaches the AI without each controller having to remember it.
/// The rebuild's own writes (KnowledgeChunks) and contact messages don't trigger it.
/// </summary>
public class KnowledgeChangeInterceptor : SaveChangesInterceptor
{
    private readonly KnowledgeIndexQueue _queue;
    public KnowledgeChangeInterceptor(KnowledgeIndexQueue queue) => _queue = queue;

    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        Check(eventData.Context);
        return result;
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData eventData,
        InterceptionResult<int> result, CancellationToken cancellationToken = default)
    {
        Check(eventData.Context);
        return ValueTask.FromResult(result);
    }

    private void Check(DbContext? context)
    {
        if (context is null) return;
        var touched = context.ChangeTracker.Entries().Any(e =>
            e.State is EntityState.Added or EntityState.Modified or EntityState.Deleted
            && KnowledgeSources.SourceEntityTypes.Contains(e.Metadata.ClrType));
        // Queued now, run after the debounce, by which time this save has finished.
        if (touched) _queue.Request();
    }
}
