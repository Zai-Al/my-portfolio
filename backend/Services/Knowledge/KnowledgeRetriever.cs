// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Pgvector;
using Pgvector.EntityFrameworkCore;
using PortfolioApi.Data;
using PortfolioApi.Models;
using PortfolioApi.Services.Gemini;

namespace PortfolioApi.Services.Knowledge;

/// <summary>
/// Finds the chunks most relevant to a question: by meaning (cosine distance between
/// embeddings, pgvector's &lt;=&gt;), or by shared keywords when embeddings aren't available.
/// </summary>
public partial class KnowledgeRetriever
{
    public const int TopK = 6;

    private readonly AppDbContext _db;
    private readonly IGeminiClient _gemini;

    public KnowledgeRetriever(AppDbContext db, IGeminiClient gemini)
    {
        _db = db;
        _gemini = gemini;
    }

    public async Task<List<KnowledgeChunk>> RetrieveAsync(string query, CancellationToken ct)
    {
        var embedding = await _gemini.EmbedAsync([query], EmbeddingTask.Query, ct);
        if (embedding.Outcome == GeminiOutcome.Ok)
        {
            var vector = new Vector(embedding.Vectors[0]);
            var nearest = await WithoutVectors(_db.KnowledgeChunks
                    .Where(c => c.Embedding != null)
                    .OrderBy(c => c.Embedding!.CosineDistance(vector)))
                .Take(TopK)
                .ToListAsync(ct);
            if (nearest.Count > 0) return nearest;
        }
        return await KeywordSearchAsync(query, ct);
    }

    /// <summary>Fallback: score by words shared with the question (title words count triple).</summary>
    private async Task<List<KnowledgeChunk>> KeywordSearchAsync(string query, CancellationToken ct)
    {
        var words = Words(query).Where(w => w.Length > 2 && !StopWords.Contains(w)).ToHashSet();
        if (words.Count == 0) return [];

        var all = await WithoutVectors(_db.KnowledgeChunks.AsQueryable()).ToListAsync(ct);
        return all
            .Select(c => (Chunk: c, Score:
                3 * Words(c.Title).Count(words.Contains) + Words(c.Content).Count(words.Contains)))
            .Where(x => x.Score > 0)
            .OrderByDescending(x => x.Score)
            .Take(TopK)
            .Select(x => x.Chunk)
            .ToList();
    }

    // The vectors aren't needed after the search; leaving them out keeps the reply small.
    private static IQueryable<KnowledgeChunk> WithoutVectors(IQueryable<KnowledgeChunk> q) =>
        q.AsNoTracking().Select(c => new KnowledgeChunk
        {
            Id = c.Id, SourceType = c.SourceType, SourceId = c.SourceId, ChunkIndex = c.ChunkIndex,
            Title = c.Title, Content = c.Content, Anchor = c.Anchor, UpdatedAt = c.UpdatedAt,
        });

    private static IEnumerable<string> Words(string text) =>
        WordPattern().Matches(text.ToLowerInvariant()).Select(m => m.Value);

    [GeneratedRegex(@"[\p{L}\p{N}+#.]+")]
    private static partial Regex WordPattern();

    private static readonly HashSet<string> StopWords =
    [
        "the", "and", "for", "you", "your", "are", "was", "what", "which", "who", "how", "can", "did",
        "does", "with", "about", "have", "has", "this", "that", "there", "here", "where", "when", "why",
        "tell", "from", "into", "any", "all", "she", "her", "his", "they", "them", "use", "get",
    ];
}
