// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace PortfolioApi.Tests.Postgres;

/// <summary>The real API (TestApiFactory's setup) on a real Postgres database instead of in memory.</summary>
public class PostgresApiFactory(string connectionString) : TestApiFactory
{
    protected override void ConfigureDatabase(DbContextOptionsBuilder options) =>
        options.UseNpgsql(connectionString, npgsql => npgsql.UseVector());
}

/// <summary>
/// Requests go through the whole stack to Postgres: lists stored as text[] arrays, Arabic
/// text, the single SiteSettings row, and every public read's query.
/// </summary>
[Collection(PostgresCollection.Name)]
public class ApiOnPostgresTests(PostgresFixture postgres)
{
    private async Task<PostgresApiFactory> NewApi() => new(await postgres.CreateMigratedDatabaseAsync());

    private static HttpClient Admin(PostgresApiFactory api)
    {
        var client = api.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestApiFactory.Token(TestApiFactory.AdminEmail));
        return client;
    }

    [SkippableTheory]
    [InlineData("/api/experiences")]
    [InlineData("/api/projects")]
    [InlineData("/api/skill-categories")]
    [InlineData("/api/skills")]
    [InlineData("/api/certifications")]
    [InlineData("/api/education")]
    [InlineData("/api/guides")]
    [InlineData("/api/site-settings")]
    public async Task Public_reads_work_on_an_empty_database(string path)
    {
        Skip.If(postgres.Unavailable is not null, postgres.Unavailable);
        await using var api = await NewApi();

        var response = await api.CreateClient().GetAsync(path);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [SkippableFact]
    public async Task Lists_and_Arabic_text_round_trip()
    {
        Skip.If(postgres.Unavailable is not null, postgres.Unavailable);
        await using var api = await NewApi();

        var created = await Admin(api).PostAsJsonAsync("/api/projects", new
        {
            title = "Sample Shop",
            slug = "sample-shop",
            summary = "s",
            description = "d",
            tech = new[] { "C#", "PostgreSQL", "pgvector" },
            highlights = new[] { "Fast", "Tested" },
            titleAr = "متجر تجريبي",
            highlightsAr = new[] { "سريع" },
        });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);

        var projects = await api.CreateClient().GetFromJsonAsync<JsonElement>("/api/projects");
        var project = Assert.Single(projects.EnumerateArray());
        Assert.Equal(["C#", "PostgreSQL", "pgvector"],
            project.GetProperty("tech").EnumerateArray().Select(t => t.GetString()));
        Assert.Equal("متجر تجريبي", project.GetProperty("titleAr").GetString());
        Assert.Equal("سريع", project.GetProperty("highlightsAr")[0].GetString());
    }

    [SkippableFact]
    public async Task A_duplicate_slug_is_a_readable_409_not_a_server_error()
    {
        Skip.If(postgres.Unavailable is not null, postgres.Unavailable);
        await using var api = await NewApi();
        var project = new { title = "One", slug = "taken", summary = "s", description = "d" };
        Assert.Equal(HttpStatusCode.Created, (await Admin(api).PostAsJsonAsync("/api/projects", project)).StatusCode);

        var again = await Admin(api).PostAsJsonAsync("/api/projects", project with { title = "Two" });

        Assert.Equal(HttpStatusCode.Conflict, again.StatusCode);
    }

    [SkippableFact]
    public async Task Site_settings_stay_one_row_across_saves()
    {
        Skip.If(postgres.Unavailable is not null, postgres.Unavailable);
        var connectionString = await postgres.CreateMigratedDatabaseAsync();
        await using var api = new PostgresApiFactory(connectionString);

        foreach (var name in new[] { "First Name", "Second Name" })
            Assert.Equal(HttpStatusCode.OK,
                (await Admin(api).PutAsJsonAsync("/api/site-settings", new { fullName = name })).StatusCode);

        var settings = await api.CreateClient().GetFromJsonAsync<JsonElement>("/api/site-settings");
        Assert.Equal("Second Name", settings.GetProperty("fullName").GetString());
        await using var db = PostgresFixture.CreateContext(connectionString);
        Assert.Equal(1, await db.SiteSettings.CountAsync());
    }
}
