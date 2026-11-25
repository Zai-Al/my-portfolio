// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace PortfolioApi.Tests.Postgres;

/// <summary>
/// The migrations build a working database from nothing, and the C# model has no change
/// that's missing a migration (which would only show up as an error on Render).
/// </summary>
[Collection(PostgresCollection.Name)]
public class MigrationTests(PostgresFixture postgres)
{
    [SkippableFact]
    public async Task Every_migration_applies_to_a_fresh_database()
    {
        Skip.If(postgres.Unavailable is not null, postgres.Unavailable);
        var connectionString = await postgres.CreateEmptyDatabaseAsync();
        await using var db = PostgresFixture.CreateContext(connectionString);

        await db.Database.MigrateAsync();

        Assert.Empty(await db.Database.GetPendingMigrationsAsync());
        Assert.Equal(db.Database.GetMigrations(), await db.Database.GetAppliedMigrationsAsync());
    }

    [SkippableFact]
    public async Task The_model_has_no_changes_missing_a_migration()
    {
        Skip.If(postgres.Unavailable is not null, postgres.Unavailable);
        await using var db = PostgresFixture.CreateContext(await postgres.CreateMigratedDatabaseAsync());

        // Fails when an entity or OnModelCreating changed without `dotnet ef migrations add`.
        Assert.False(db.Database.HasPendingModelChanges(),
            "The model changed without a migration: run `dotnet ef migrations add <Name>` in backend/.");
    }

    [SkippableFact]
    public async Task The_vector_column_and_its_search_index_exist()
    {
        Skip.If(postgres.Unavailable is not null, postgres.Unavailable);
        var connectionString = await postgres.CreateMigratedDatabaseAsync();
        await using var conn = new NpgsqlConnection(connectionString);
        await conn.OpenAsync();

        var columnType = await Scalar(conn, """
            SELECT format_type(atttypid, atttypmod) FROM pg_attribute
            WHERE attrelid = '"KnowledgeChunks"'::regclass AND attname = 'Embedding'
            """);
        Assert.Equal("vector(768)", columnType);

        var indexes = await Scalar(conn, """
            SELECT string_agg(indexdef, ' | ') FROM pg_indexes WHERE tablename = 'KnowledgeChunks'
            """);
        Assert.Contains("USING hnsw", indexes);
        Assert.Contains("vector_cosine_ops", indexes);

        var extensionSchema = await Scalar(conn, """
            SELECT n.nspname FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace
            WHERE e.extname = 'vector'
            """);
        Assert.Equal("extensions", extensionSchema);
    }

    private static async Task<string?> Scalar(NpgsqlConnection conn, string sql)
    {
        await using var cmd = new NpgsqlCommand(sql, conn);
        return (await cmd.ExecuteScalarAsync())?.ToString();
    }
}
