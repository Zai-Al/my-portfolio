// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using Microsoft.EntityFrameworkCore;
using Npgsql;
using PortfolioApi.Models;
using PortfolioApi.Services.SystemLog;

namespace PortfolioApi.Tests.Postgres;

/// <summary>
/// The database itself refuses bad data, even if a request got past the API's own checks
/// (which the in-memory database can't show: it ignores unique indexes and foreign keys).
/// </summary>
[Collection(PostgresCollection.Name)]
public class DatabaseRulesTests(PostgresFixture postgres)
{
    private static void AssertUniqueViolation(DbUpdateException ex) =>
        Assert.Equal(PostgresErrorCodes.UniqueViolation, Assert.IsType<PostgresException>(ex.InnerException).SqlState);

    [SkippableFact]
    public async Task Two_projects_cannot_share_a_slug()
    {
        Skip.If(postgres.Unavailable is not null, postgres.Unavailable);
        await using var db = PostgresFixture.CreateContext(await postgres.CreateMigratedDatabaseAsync());
        db.Projects.Add(new Project { Title = "One", Slug = "same-slug" });
        await db.SaveChangesAsync();

        db.Projects.Add(new Project { Title = "Two", Slug = "same-slug" });
        AssertUniqueViolation(await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync()));
    }

    [SkippableFact]
    public async Task A_knowledge_chunk_key_is_unique()
    {
        Skip.If(postgres.Unavailable is not null, postgres.Unavailable);
        await using var db = PostgresFixture.CreateContext(await postgres.CreateMigratedDatabaseAsync());
        KnowledgeChunk Chunk() => new() { SourceType = "guide", SourceId = 1, ChunkIndex = 0, Title = "t", Content = "c" };
        db.KnowledgeChunks.Add(Chunk());
        await db.SaveChangesAsync();

        // The indexer updates rows by this key, so a second copy must never exist.
        db.KnowledgeChunks.Add(Chunk());
        AssertUniqueViolation(await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync()));
    }

    [SkippableFact]
    public async Task Deleting_a_skill_category_deletes_its_skills()
    {
        Skip.If(postgres.Unavailable is not null, postgres.Unavailable);
        await using var db = PostgresFixture.CreateContext(await postgres.CreateMigratedDatabaseAsync());
        var category = new SkillCategory { Name = "Backend" };
        category.Skills.Add(new Skill { Name = "C#" });
        db.SkillCategories.Add(category);
        await db.SaveChangesAsync();

        // A raw delete, so this is the database's cascade rule at work, not EF's tracking.
        await db.SkillCategories.Where(c => c.Id == category.Id).ExecuteDeleteAsync();

        Assert.Equal(0, await db.Skills.CountAsync());
    }

    [SkippableFact]
    public async Task System_log_repeats_stay_one_row_on_Postgres()
    {
        Skip.If(postgres.Unavailable is not null, postgres.Unavailable);
        var connectionString = await postgres.CreateMigratedDatabaseAsync();
        var problem = new LogEvent("Error", "Src", "Boom {Id}", "Boom 1", "System.Exception", "stack", DateTime.UtcNow);

        // Two separate saves (two batches from the writer), as in production.
        await using (var db = PostgresFixture.CreateContext(connectionString))
            await SystemLogStore.SaveAsync(db, [problem], default);
        await using (var db = PostgresFixture.CreateContext(connectionString))
            await SystemLogStore.SaveAsync(db, [problem with { Message = "Boom 2" }], default);

        await using var check = PostgresFixture.CreateContext(connectionString);
        var row = Assert.Single(await check.SystemLog.ToListAsync());
        Assert.Equal(2, row.Count);
        Assert.Equal("Boom 2", row.Message);
    }

    [SkippableFact]
    public async Task Projects_saved_by_older_code_get_the_buttons_switched_off()
    {
        Skip.If(postgres.Unavailable is not null, postgres.Unavailable);
        var connectionString = await postgres.CreateMigratedDatabaseAsync();
        await using var conn = new NpgsqlConnection(connectionString);
        await conn.OpenAsync();

        // The live site's current code doesn't know the new columns; its inserts must still work.
        await using var insert = new NpgsqlCommand("""
            INSERT INTO "Projects" ("Title", "Slug", "Summary", "Description", "Highlights", "Tech",
                "Screenshots", "Icon", "Featured", "SortOrder", "HighlightsAr")
            VALUES ('Old', 'old', '', '', '{}', '{}', '{}', 'FaProjectDiagram', false, 0, '{}')
            """, conn);
        await insert.ExecuteNonQueryAsync();

        await using var db = PostgresFixture.CreateContext(connectionString);
        var project = await db.Projects.SingleAsync();
        Assert.False(project.ShowRepo);
        Assert.False(project.ShowDemo);
        Assert.Null(project.Challenge);
    }
}
