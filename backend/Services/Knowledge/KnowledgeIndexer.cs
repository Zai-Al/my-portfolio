// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Pgvector;
using PortfolioApi.Data;
using PortfolioApi.Models;
using PortfolioApi.Services.Gemini;

namespace PortfolioApi.Services.Knowledge;

/// <summary>
/// Brings KnowledgeChunks in line with the site's content. Only new or changed text is
/// sent to Gemini, so a rebuild after a small edit costs one or two embedding calls.
/// Text is saved before it is embedded: if Gemini is down or out of quota, the chatbot
/// still finds it by keywords, and the next rebuild fills in the missing embeddings.
/// </summary>
public class KnowledgeIndexer
{
    private readonly AppDbContext _db;
    private readonly IGeminiClient _gemini;
    private readonly KnowledgeOptions _options;
    private readonly ILogger<KnowledgeIndexer> _logger;

    public KnowledgeIndexer(AppDbContext db, IGeminiClient gemini, IOptions<KnowledgeOptions> options,
        ILogger<KnowledgeIndexer> logger)
    {
        _db = db;
        _gemini = gemini;
        _options = options.Value;
        _logger = logger;
    }

    /// <summary>Returns a one-line summary for the admin portal.</summary>
    public async Task<string> RebuildAsync(CancellationToken ct)
    {
        var desired = await KnowledgeSources.BuildChunksAsync(_db, ct);
        var existing = await _db.KnowledgeChunks.ToListAsync(ct);
        var byKey = existing.ToDictionary(Key);
        var now = DateTime.UtcNow;

        int added = 0, changed = 0;
        var wanted = new HashSet<(string, int, int)>();
        foreach (var d in desired)
        {
            wanted.Add(Key(d));
            if (!byKey.TryGetValue(Key(d), out var row))
            {
                d.UpdatedAt = now;
                _db.KnowledgeChunks.Add(d);
                added++;
                continue;
            }
            if (row.Content == d.Content && row.Title == d.Title && row.Anchor == d.Anchor) continue;
            if (row.Content != d.Content) row.Embedding = null; // the old vector describes the old text
            row.Content = d.Content;
            row.Title = d.Title;
            row.Anchor = d.Anchor;
            row.UpdatedAt = now;
            changed++;
        }
        var stale = existing.Where(r => !wanted.Contains(Key(r))).ToList();
        _db.KnowledgeChunks.RemoveRange(stale);
        await _db.SaveChangesAsync(ct);

        var (embedded, problem) = await EmbedMissingAsync(ct);
        var total = desired.Count;
        var summary = $"{total} chunks ({added} new, {changed} changed, {stale.Count} removed); {embedded} embedded";
        return problem is null ? summary : $"{summary}. {problem}";
    }

    /// <summary>Embeds every chunk without a vector, in paced batches. Returns how many, and why it stopped early.</summary>
    private async Task<(int Embedded, string? Problem)> EmbedMissingAsync(CancellationToken ct)
    {
        var pending = await _db.KnowledgeChunks.Where(c => c.Embedding == null).OrderBy(c => c.Id).ToListAsync(ct);
        var batchSize = Math.Clamp(_options.EmbedBatchSize, 1, 100);
        var embedded = 0;

        for (var i = 0; i < pending.Count; i += batchSize)
        {
            if (i > 0) await Task.Delay(TimeSpan.FromSeconds(Math.Max(0, _options.EmbedBatchDelaySeconds)), ct);

            var batch = pending.Skip(i).Take(batchSize).ToList();
            var result = await _gemini.EmbedAsync(batch.Select(c => c.Content).ToList(), EmbeddingTask.Document, ct);
            if (result.Outcome != GeminiOutcome.Ok)
            {
                var left = pending.Count - embedded;
                var why = result.Outcome switch
                {
                    GeminiOutcome.NotConfigured => "Gemini isn't configured",
                    GeminiOutcome.QuotaExceeded => "Gemini's free quota is used up for now",
                    GeminiOutcome.Busy => "Gemini is busy",
                    _ => "Gemini returned an error",
                };
                _logger.LogWarning("Knowledge rebuild stopped embedding: {Outcome}", result.Outcome);
                return (embedded, $"{left} still waiting for embeddings ({why}); the chatbot uses keyword search for those until the next rebuild.");
            }

            for (var j = 0; j < batch.Count; j++) batch[j].Embedding = new Vector(result.Vectors[j]);
            await _db.SaveChangesAsync(ct);
            embedded += batch.Count;
        }
        return (embedded, null);
    }

    private static (string, int, int) Key(KnowledgeChunk c) => (c.SourceType, c.SourceId, c.ChunkIndex);
}
