// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using Microsoft.EntityFrameworkCore;
using Npgsql;
using PortfolioApi.Data;
using Testcontainers.PostgreSql;

namespace PortfolioApi.Tests.Postgres;

/// <summary>
/// One throwaway Postgres + pgvector container (Docker) shared by the tests in the "Postgres"
/// collection; each test class makes its own fresh database inside it, so they never see each
/// other's rows. The in-memory database the other tests use can't run migrations, vector
/// search or unique indexes - these tests cover exactly that.
///
/// No Docker on a laptop: the tests are skipped (with a reason). In CI they fail instead,
/// so they can never silently stop running.
/// </summary>
public sealed class PostgresFixture : IAsyncLifetime
{
    private PostgreSqlContainer? _startedContainer;
    private int _databases;

    private PostgreSqlContainer Container =>
        _startedContainer ?? throw new InvalidOperationException(Unavailable);

    /// <summary>Why the tests can't run here (no Docker), or null when they can.</summary>
    public string? Unavailable { get; private set; }

    public async Task InitializeAsync()
    {
        try
        {
            // pgvector's official image: Postgres with the vector extension available, like
            // Supabase. Built here, not in a field: building already looks for Docker.
            var container = new PostgreSqlBuilder("pgvector/pgvector:pg17").Build();
            await container.StartAsync();
            _startedContainer = container;
        }
        catch (Exception ex) when (Environment.GetEnvironmentVariable("CI") is null)
        {
            Unavailable = $"Docker isn't running, so the Postgres tests are skipped ({ex.GetType().Name}).";
        }
    }

    public async Task DisposeAsync()
    {
        if (_startedContainer is not null) await _startedContainer.DisposeAsync();
    }

    /// <summary>
    /// A new, empty database with every migration applied, set up like Supabase: pgvector in
    /// an "extensions" schema that's on the search path. Returns its connection string.
    /// </summary>
    public async Task<string> CreateMigratedDatabaseAsync()
    {
        var connectionString = await CreateEmptyDatabaseAsync();
        await using (var db = CreateContext(connectionString))
            await db.Database.MigrateAsync();
        await ReloadTypesAsync(connectionString);
        return connectionString;
    }

    /// <summary>A new database with nothing in it but Supabase's "extensions" schema.</summary>
    public async Task<string> CreateEmptyDatabaseAsync()
    {
        var name = $"test_{Interlocked.Increment(ref _databases)}";
        await using (var admin = new NpgsqlConnection(Container.GetConnectionString()))
        {
            await admin.OpenAsync();
            await using var create = new NpgsqlCommand($"CREATE DATABASE {name}", admin);
            await create.ExecuteNonQueryAsync();
        }

        var connectionString = new NpgsqlConnectionStringBuilder(Container.GetConnectionString())
        {
            Database = name,
            SearchPath = "public,extensions",
        }.ConnectionString;

        await using var conn = new NpgsqlConnection(connectionString);
        await conn.OpenAsync();
        await using var schema = new NpgsqlCommand("CREATE SCHEMA IF NOT EXISTS extensions", conn);
        await schema.ExecuteNonQueryAsync();
        return connectionString;
    }

    /// <summary>A context on the given database, set up like the API's (Npgsql + pgvector).</summary>
    public static AppDbContext CreateContext(string connectionString) =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionString, npgsql => npgsql.UseVector())
            .Options);

    // Npgsql remembers a database's types from its first connection, which came before the
    // migration created "vector"; make it look again so vectors can be read and written.
    private static async Task ReloadTypesAsync(string connectionString)
    {
        await using var conn = new NpgsqlConnection(connectionString);
        await conn.OpenAsync();
        await conn.ReloadTypesAsync();
    }
}

[CollectionDefinition(Name)]
public sealed class PostgresCollection : ICollectionFixture<PostgresFixture>
{
    public const string Name = "Postgres";
}
