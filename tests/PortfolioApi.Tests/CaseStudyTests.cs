// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using PortfolioApi.Data;
using PortfolioApi.Services.Knowledge;

namespace PortfolioApi.Tests;

/// <summary>
/// The admin-controlled Repo/Demo buttons, the case-study fields (English + Arabic) and the
/// SEO description: saved, read back publicly, and the case study known to the AI guide.
/// </summary>
public class CaseStudyTests : IClassFixture<TestApiFactory>
{
    private readonly TestApiFactory _factory;
    public CaseStudyTests(TestApiFactory factory) => _factory = factory;

    private HttpClient Admin()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestApiFactory.Token(TestApiFactory.AdminEmail));
        return client;
    }

    private async Task<JsonElement> PublicProject(string slug)
    {
        var all = await _factory.CreateClient().GetFromJsonAsync<JsonElement>("/api/projects");
        return all.EnumerateArray().Single(p => p.GetProperty("slug").GetString() == slug);
    }

    [Fact]
    public async Task Button_switches_and_case_study_are_saved_and_public()
    {
        var slug = $"case-{Guid.NewGuid():N}";
        var created = await Admin().PostAsJsonAsync("/api/projects", new
        {
            title = $"Case {slug}",
            slug,
            summary = "s",
            description = "d",
            repoUrl = "https://github.com/example/repo",
            showRepo = true,
            showDemo = false,
            challenge = "Orders failed silently.",
            learned = "Log everything that can fail.",
            challengeAr = "كانت الطلبات تفشل بصمت.",
            learnedAr = "سجّل كل ما قد يفشل.",
        });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);

        var project = await PublicProject(slug);
        Assert.True(project.GetProperty("showRepo").GetBoolean());
        Assert.False(project.GetProperty("showDemo").GetBoolean());
        Assert.Equal("Orders failed silently.", project.GetProperty("challenge").GetString());
        Assert.Equal("Log everything that can fail.", project.GetProperty("learned").GetString());
        Assert.Equal("كانت الطلبات تفشل بصمت.", project.GetProperty("challengeAr").GetString());
        Assert.Equal("سجّل كل ما قد يفشل.", project.GetProperty("learnedAr").GetString());
    }

    [Fact]
    public async Task Buttons_are_off_unless_ticked()
    {
        var slug = $"plain-{Guid.NewGuid():N}";
        await Admin().PostAsJsonAsync("/api/projects", new { title = $"Plain {slug}", slug, summary = "s", description = "d" });

        var project = await PublicProject(slug);
        Assert.False(project.GetProperty("showRepo").GetBoolean());
        Assert.False(project.GetProperty("showDemo").GetBoolean());
        Assert.Equal(JsonValueKind.Null, project.GetProperty("challenge").ValueKind);
    }

    [Fact]
    public async Task The_AI_guide_knows_the_case_study()
    {
        var slug = $"ai-{Guid.NewGuid():N}";
        await Admin().PostAsJsonAsync("/api/projects", new
        {
            title = $"AI {slug}", slug, summary = "s", description = "d",
            challenge = "A hard problem", learned = "A useful lesson",
        });

        using var scope = _factory.Services.CreateScope();
        var chunks = await KnowledgeSources.BuildChunksAsync(scope.ServiceProvider.GetRequiredService<AppDbContext>());
        var text = string.Join("\n", chunks.Where(c => c.Title == $"AI {slug}").Select(c => c.Content));
        Assert.Contains("Challenge: A hard problem", text);
        Assert.Contains("What I learned: A useful lesson", text);
    }

    [Fact]
    public async Task Hidden_links_stay_out_of_the_public_API_and_the_AI_guide()
    {
        var slug = $"hidden-{Guid.NewGuid():N}";
        var created = await Admin().PostAsJsonAsync("/api/projects", new
        {
            title = $"Hidden {slug}", slug, summary = "s", description = "d",
            repoUrl = "https://github.com/example/team-repo",
            demoUrl = "https://demo.example.com",
            showRepo = false,
            showDemo = false,
        });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var id = (await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetInt32();

        // Public list and single read: no links.
        var listed = await PublicProject(slug);
        Assert.Equal(JsonValueKind.Null, listed.GetProperty("repoUrl").ValueKind);
        Assert.Equal(JsonValueKind.Null, listed.GetProperty("demoUrl").ValueKind);
        var single = await _factory.CreateClient().GetFromJsonAsync<JsonElement>($"/api/projects/{id}");
        Assert.Equal(JsonValueKind.Null, single.GetProperty("repoUrl").ValueKind);
        Assert.Equal(JsonValueKind.Null, single.GetProperty("demoUrl").ValueKind);

        // The admin still gets them, so saving the form doesn't wipe them.
        var full = await Admin().GetFromJsonAsync<JsonElement>("/api/projects/full");
        var mine = full.EnumerateArray().Single(p => p.GetProperty("slug").GetString() == slug);
        Assert.Equal("https://github.com/example/team-repo", mine.GetProperty("repoUrl").GetString());
        Assert.Equal("https://demo.example.com", mine.GetProperty("demoUrl").GetString());

        // The AI guide knows a repo exists, but never gets either link.
        using var scope = _factory.Services.CreateScope();
        var chunks = await KnowledgeSources.BuildChunksAsync(scope.ServiceProvider.GetRequiredService<AppDbContext>());
        var text = string.Join("\n", chunks.Where(c => c.Title == $"Hidden {slug}").Select(c => c.Content));
        Assert.DoesNotContain("example/team-repo", text);
        Assert.DoesNotContain("demo.example.com", text);
        Assert.Contains("Source code: private", text);
    }

    [Fact]
    public async Task Shown_links_reach_the_public_API_and_the_AI_guide()
    {
        var slug = $"shown-{Guid.NewGuid():N}";
        await Admin().PostAsJsonAsync("/api/projects", new
        {
            title = $"Shown {slug}", slug, summary = "s", description = "d",
            repoUrl = "https://github.com/example/open-repo",
            demoUrl = "https://open-demo.example.com",
            showRepo = true,
            showDemo = true,
        });

        var listed = await PublicProject(slug);
        Assert.Equal("https://github.com/example/open-repo", listed.GetProperty("repoUrl").GetString());
        Assert.Equal("https://open-demo.example.com", listed.GetProperty("demoUrl").GetString());

        using var scope = _factory.Services.CreateScope();
        var chunks = await KnowledgeSources.BuildChunksAsync(scope.ServiceProvider.GetRequiredService<AppDbContext>());
        var text = string.Join("\n", chunks.Where(c => c.Title == $"Shown {slug}").Select(c => c.Content));
        Assert.Contains("Source code: https://github.com/example/open-repo", text);
        Assert.Contains("Live demo: https://open-demo.example.com", text);
    }

    [Fact]
    public async Task SEO_description_is_saved_in_both_languages_and_public()
    {
        var saved = await Admin().PutAsJsonAsync("/api/site-settings", new
        {
            fullName = "Test Person",
            seoDescription = "Full-stack engineer building .NET and React apps.",
            seoDescriptionAr = "وصف قصير للموقع.",
        });
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);

        var settings = await _factory.CreateClient().GetFromJsonAsync<JsonElement>("/api/site-settings");
        Assert.Equal("Full-stack engineer building .NET and React apps.", settings.GetProperty("seoDescription").GetString());
        Assert.Equal("وصف قصير للموقع.", settings.GetProperty("seoDescriptionAr").GetString());
    }
}
