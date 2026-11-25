// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using Microsoft.EntityFrameworkCore;
using Npgsql;
using PortfolioApi.Models;

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
}
