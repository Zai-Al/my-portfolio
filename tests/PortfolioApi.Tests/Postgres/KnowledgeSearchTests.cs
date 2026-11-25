// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Pgvector;
using PortfolioApi.Data;
using PortfolioApi.Models;
using PortfolioApi.Services.Gemini;
using PortfolioApi.Services.Knowledge;

namespace PortfolioApi.Tests.Postgres;

/// <summary>
/// The AI guide's retrieval on real pgvector: nearest chunks by cosine distance, the
/// indexer storing embeddings and updating in place, and the keyword fallback.
/// </summary>
[Collection(PostgresCollection.Name)]
public class KnowledgeSearchTests(PostgresFixture postgres)
{
    private const int Dimensions = KnowledgeChunk.EmbeddingDimensions;

    /// <summary>A vector pointing along one axis, so "nearest" is easy to predict.</summary>
    private static float[] Axis(int index, float strength = 1f)
    {
        var v = new float[Dimensions];
        v[index] = strength;
        return v;
    }

    /// <summary>A Gemini whose embeddings are fixed by the test: no network, no quota.</summary>
    private sealed class FakeGemini(Func<string, float[]?> embed) : IGeminiClient
    {
        public Task<GeminiEmbeddings> EmbedAsync(IReadOnlyList<string> texts, EmbeddingTask task,
            CancellationToken ct = default)
        {
            var vectors = texts.Select(embed).ToList();
            return Task.FromResult(vectors.Any(v => v is null)
                ? new GeminiEmbeddings(GeminiOutcome.QuotaExceeded, [])
                : new GeminiEmbeddings(GeminiOutcome.Ok, vectors.Select(v => v!).ToList()));
        }

        public Task<GeminiStream> StreamAsync(string s, IReadOnlyList<GeminiTurn> c, CancellationToken ct = default) =>
            throw new NotSupportedException();

        public Task<GeminiText> GenerateJsonAsync(string s, string u, CancellationToken ct = default) =>
            throw new NotSupportedException();
    }

    private static KnowledgeChunk Chunk(int id, string title, float[]? embedding) => new()
    {
        SourceType = "guide",
        SourceId = id,
        ChunkIndex = 0,
        Title = title,
        Content = $"{title} content",
        Embedding = embedding is null ? null : new Vector(embedding),
    };

    private async Task<AppDbContext> NewDatabase() =>
        PostgresFixture.CreateContext(await postgres.CreateMigratedDatabaseAsync());

    [SkippableFact]
    public async Task Finds_the_chunks_nearest_in_meaning_first()
    {
        Skip.If(postgres.Unavailable is not null, postgres.Unavailable);
        await using var db = await NewDatabase();
        db.KnowledgeChunks.AddRange(
            Chunk(1, "Skills", Axis(0)),
            Chunk(2, "Projects", Axis(1)),
            Chunk(3, "Education", Axis(2)),
            Chunk(4, "Not embedded yet", null));
        await db.SaveChangesAsync();

        // The question's vector is mostly "Projects", a bit "Education", nothing "Skills".
        var question = Axis(1);
        question[2] = 0.3f;
        var retriever = new KnowledgeRetriever(db, new FakeGemini(_ => question));

        var found = await retriever.RetrieveAsync("anything", default);

        Assert.Equal(["Projects", "Education", "Skills"], found.Select(c => c.Title));
        Assert.All(found, c => Assert.Null(c.Embedding)); // vectors aren't sent back
    }

    [SkippableFact]
    public async Task Falls_back_to_keywords_when_embeddings_are_unavailable()
    {
        Skip.If(postgres.Unavailable is not null, postgres.Unavailable);
        await using var db = await NewDatabase();
        db.KnowledgeChunks.AddRange(Chunk(1, "Kubernetes deployment", Axis(0)), Chunk(2, "Cooking", Axis(1)));
        await db.SaveChangesAsync();
        var retriever = new KnowledgeRetriever(db, new FakeGemini(_ => null)); // quota used up

        var found = await retriever.RetrieveAsync("kubernetes experience", default);

        Assert.Equal("Kubernetes deployment", Assert.Single(found).Title);
    }

    [SkippableFact]
    public async Task Indexer_embeds_content_and_updates_in_place()
    {
        Skip.If(postgres.Unavailable is not null, postgres.Unavailable);
        await using var db = await NewDatabase();
        db.Guides.Add(new Guide { Title = "How do I contact you?", Answer = "Use the contact form." });
        await db.SaveChangesAsync();

        var calls = 0;
        var gemini = new FakeGemini(_ => { calls++; return Axis(7); });
        var options = Options.Create(new KnowledgeOptions { EmbedBatchDelaySeconds = 0 });
        var indexer = new KnowledgeIndexer(db, gemini, options, NullLogger<KnowledgeIndexer>.Instance);

        await indexer.RebuildAsync(default);
        var chunks = await db.KnowledgeChunks.AsNoTracking().ToListAsync();
        Assert.NotEmpty(chunks);
        Assert.All(chunks, c => Assert.NotNull(c.Embedding));
        var embeddedFirstTime = calls;

        // Nothing changed: same rows (the unique key is respected), nothing embedded again.
        await indexer.RebuildAsync(default);
        Assert.Equal(chunks.Count, await db.KnowledgeChunks.CountAsync());
        Assert.Equal(embeddedFirstTime, calls);

        // The vector search finds the guide.
        var found = await new KnowledgeRetriever(db, gemini).RetrieveAsync("contact", default);
        Assert.Contains(found, c => c.Title.Contains("contact", StringComparison.OrdinalIgnoreCase));
    }
}
