// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using PortfolioApi.Controllers;
using PortfolioApi.Services.Gemini;
using PortfolioApi.Services.Translation;

namespace PortfolioApi.Tests;

/// <summary>
/// The admin's "translate to Arabic" (POST /api/translate): admin only, input limits, and only
/// well-formed translations of the fields that were sent come back. Gemini is faked.
/// </summary>
public class TranslateTests : IClassFixture<TestApiFactory>
{
    private readonly TestApiFactory _factory;
    public TranslateTests(TestApiFactory factory) => _factory = factory;

    /// <summary>A Gemini that answers every request with <see cref="Reply"/>.</summary>
    private sealed class FakeGemini(GeminiText reply) : IGeminiClient
    {
        public string? LastUserText { get; private set; }

        public Task<GeminiText> GenerateJsonAsync(string systemInstruction, string userText, CancellationToken ct = default)
        {
            LastUserText = userText;
            return Task.FromResult(reply);
        }

        public Task<GeminiStream> StreamAsync(string s, IReadOnlyList<GeminiTurn> c, CancellationToken ct = default) =>
            throw new NotSupportedException();

        public Task<GeminiEmbeddings> EmbedAsync(IReadOnlyList<string> t, EmbeddingTask k, CancellationToken ct = default) =>
            Task.FromResult(new GeminiEmbeddings(GeminiOutcome.NotConfigured, []));
    }

    private HttpClient Admin(IGeminiClient? gemini = null)
    {
        var factory = gemini is null
            ? _factory
            : _factory.WithWebHostBuilder(b => b.ConfigureTestServices(s =>
            {
                s.RemoveAll<IGeminiClient>();
                s.AddSingleton(gemini);
            }));
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestApiFactory.Token(TestApiFactory.AdminEmail));
        return client;
    }

    [Fact]
    public async Task Visitors_cannot_use_it()
    {
        var response = await _factory.CreateClient()
            .PostAsJsonAsync("/api/translate", new { fields = new { role = "Intern" } });
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Theory]
    [InlineData("""{"fields":{}}""")]                       // nothing to translate
    [InlineData("""{"fields":{"role":42}}""")]              // not text
    [InlineData("""{"fields":{"bad key!":"x"}}""")]         // not a field name
    [InlineData("""{"fields":{"bullets":["ok",1]}}""")]     // a list with a non-text item
    public async Task Bad_input_is_refused(string body)
    {
        var response = await Admin().PostAsync("/api/translate",
            new StringContent(body, System.Text.Encoding.UTF8, "application/json"));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Too_much_text_is_refused()
    {
        var response = await Admin().PostAsJsonAsync("/api/translate",
            new { fields = new { description = new string('a', TranslateController.MaxTotalLength + 1) } });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Without_a_Gemini_key_it_says_so()
    {
        var response = await Admin().PostAsJsonAsync("/api/translate", new { fields = new { role = "Intern" } });
        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.Contains("Gemini", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Translations_come_back_by_field_and_extra_keys_are_dropped()
    {
        var gemini = new FakeGemini(new(GeminiOutcome.Ok,
            """{"role":"تدريب","bullets":["أولًا","ثانيًا"],"injected":"ignored"}"""));
        var response = await Admin(gemini).PostAsJsonAsync("/api/translate",
            new { fields = new { role = "Intern", bullets = new[] { "First", "Second" } } });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var fields = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("fields");
        Assert.Equal("تدريب", fields.GetProperty("role").GetString());
        Assert.Equal("ثانيًا", fields.GetProperty("bullets")[1].GetString());
        Assert.False(fields.TryGetProperty("injected", out _));
        // Gemini got the English texts as JSON.
        Assert.Contains("Intern", gemini.LastUserText);
    }

    [Fact]
    public async Task An_unreadable_reply_is_a_502_not_a_blank_save()
    {
        var gemini = new FakeGemini(new(GeminiOutcome.Ok, "Sure! Here is your translation"));
        var response = await Admin(gemini).PostAsJsonAsync("/api/translate", new { fields = new { role = "Intern" } });
        Assert.Equal(HttpStatusCode.BadGateway, response.StatusCode);
    }

    [Fact]
    public void Wrong_shapes_in_the_reply_are_dropped()
    {
        var input = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(
            """{"role":"Intern","bullets":["a","b"],"summary":"text"}""")!;
        // A list of the wrong length, a list where a text was sent, and an empty text.
        var result = TranslatePrompt.ReadResult(input, """{"role":"","bullets":["أ"],"summary":["x"]}""");
        Assert.Empty(result);
    }

    [Fact]
    public void Prompt_keeps_tech_names_and_avoids_gendered_wording()
    {
        Assert.Contains("Keep these exactly as written", TranslatePrompt.System);
        Assert.Contains("gender is", TranslatePrompt.System);
    }
}
