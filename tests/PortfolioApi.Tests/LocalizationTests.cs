// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using PortfolioApi.Services.Knowledge;

namespace PortfolioApi.Tests;

/// <summary>
/// Arabic content (the *Ar fields shown on /ar) is saved and read back like the English,
/// and the AI guide gets told which language to answer in.
/// </summary>
public class LocalizationTests : IClassFixture<TestApiFactory>
{
    private readonly TestApiFactory _factory;
    public LocalizationTests(TestApiFactory factory) => _factory = factory;

    private HttpClient Admin()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestApiFactory.Token(TestApiFactory.AdminEmail));
        return client;
    }

    [Fact]
    public async Task Arabic_fields_are_saved_and_read_back_publicly()
    {
        var company = $"Acme {Guid.NewGuid():N}";
        var created = await Admin().PostAsJsonAsync("/api/experiences", new
        {
            company,
            role = "Intern",
            startDate = "Jun 2026",
            roleAr = "متدربة",
            bulletsAr = new[] { "بنيت واجهة برمجية", "كتبت اختبارات" },
        });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);

        var all = await _factory.CreateClient().GetFromJsonAsync<JsonElement>("/api/experiences");
        var row = all.EnumerateArray().Single(e => e.GetProperty("company").GetString() == company);
        Assert.Equal("متدربة", row.GetProperty("roleAr").GetString());
        Assert.Equal(2, row.GetProperty("bulletsAr").GetArrayLength());
        // Not filled in = null / empty, so the site falls back to the English text.
        Assert.Equal(JsonValueKind.Null, row.GetProperty("companyAr").ValueKind);
    }

    [Fact]
    public async Task Arabic_profile_fields_survive_the_public_read_while_email_stays_hidden()
    {
        var saved = await Admin().PutAsJsonAsync("/api/site-settings", new
        {
            fullName = "Test Person",
            email = "hidden@test.local",
            bioAr = "نبذة قصيرة",
            softSkillsAr = new[] { "العمل الجماعي" },
        });
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);

        var settings = await _factory.CreateClient().GetFromJsonAsync<JsonElement>("/api/site-settings");
        Assert.Equal("نبذة قصيرة", settings.GetProperty("bioAr").GetString());
        Assert.Equal("العمل الجماعي", settings.GetProperty("softSkillsAr")[0].GetString());
        Assert.Equal(JsonValueKind.Null, settings.GetProperty("email").ValueKind);
    }

    [Fact]
    public async Task Ask_rejects_an_unknown_locale()
    {
        var response = await _factory.CreateClient()
            .PostAsJsonAsync("/api/ask", new { question = "hi", locale = "fr" });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public void Prompt_answers_in_the_question_language_and_falls_back_to_the_page_language()
    {
        var english = AskPrompt.Build("Test Person", []);
        Assert.Contains("Reply in the language of the visitor's latest message", english);
        Assert.Contains("If the language is unclear (e.g. only a name or a tech term), reply in English", english);
        Assert.DoesNotContain("المشاريع", english);

        var arabic = AskPrompt.Build("Test Person", [], arabicPage: true);
        Assert.Contains("reply in Arabic", arabic);
        // Points to places by the names the Arabic page shows.
        Assert.Contains("Projects = المشاريع", arabic);
    }
}
