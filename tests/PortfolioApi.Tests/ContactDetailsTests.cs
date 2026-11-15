// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using PortfolioApi.Data;
using PortfolioApi.Models;
using PortfolioApi.Services.Knowledge;

namespace PortfolioApi.Tests;

/// <summary>
/// Anti-scraping: the email and phone never appear in public responses or the AI guide's
/// knowledge. The email is only given to a browser that passed Turnstile; the phone never.
/// </summary>
public class ContactDetailsTests : IClassFixture<TestApiFactory>
{
    private const string Email = "owner@example.com";
    private const string Phone = "+973 1234 5678";

    private readonly TestApiFactory _factory;

    public ContactDetailsTests(TestApiFactory factory)
    {
        _factory = factory;
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var settings = db.SiteSettings.Find(1);
        if (settings is null) db.SiteSettings.Add(settings = new SiteSettings { Id = 1 });
        settings.FullName = "Test Owner";
        settings.Email = Email;
        settings.Phone = Phone;
        db.SaveChanges();
    }

    private Task<HttpResponseMessage> Reveal(string token) =>
        _factory.CreateClient().PostAsJsonAsync("/api/site-settings/email", new { token });

    [Fact]
    public async Task Public_settings_leave_out_email_and_phone()
    {
        var body = await _factory.CreateClient().GetStringAsync("/api/site-settings");

        Assert.DoesNotContain(Email, body);
        Assert.DoesNotContain(Phone, body);
        using var json = JsonDocument.Parse(body);
        Assert.True(json.RootElement.GetProperty("hasEmail").GetBoolean());
        Assert.Equal("Test Owner", json.RootElement.GetProperty("fullName").GetString());
    }

    [Fact]
    public async Task Admin_gets_the_full_settings()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestApiFactory.Token(TestApiFactory.AdminEmail));

        var settings = await client.GetFromJsonAsync<SiteSettings>("/api/site-settings/full");

        Assert.Equal(Email, settings!.Email);
        Assert.Equal(Phone, settings.Phone);
    }

    [Fact]
    public async Task Email_is_revealed_after_the_spam_check()
    {
        var response = await Reveal(FakeTurnstile.ValidToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("no-store", response.Headers.CacheControl?.ToString());
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains(Email, body);
        Assert.DoesNotContain(Phone, body);
    }

    [Fact]
    public async Task Email_stays_hidden_when_the_spam_check_fails()
    {
        var response = await Reveal("forged-token");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.DoesNotContain(Email, await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Reveal_without_a_token_is_refused()
    {
        var response = await _factory.CreateClient().PostAsJsonAsync("/api/site-settings/email", new { });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task AI_knowledge_has_neither_email_nor_phone()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var chunks = await KnowledgeSources.BuildChunksAsync(db);

        Assert.NotEmpty(chunks);
        Assert.All(chunks, c =>
        {
            Assert.DoesNotContain(Email, c.Content);
            Assert.DoesNotContain(Phone, c.Content);
        });
    }
}
