// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;

namespace PortfolioApi.Tests;

/// <summary>
/// Every endpoint is admin-only unless it says [AllowAnonymous] (the fallback policy in
/// Program.cs). These tests pin down exactly which endpoints are public, so making a new one
/// public has to be a deliberate change here too.
/// </summary>
public class SecureByDefaultTests : IClassFixture<TestApiFactory>
{
    private readonly TestApiFactory _factory;
    public SecureByDefaultTests(TestApiFactory factory) => _factory = factory;

    private static readonly string[] ContentTables =
    {
        "experiences", "education", "certifications", "skill-categories", "skills", "projects", "guides",
    };

    /// <summary>The only endpoints anyone may call without signing in.</summary>
    private static readonly HashSet<string> ExpectedPublic = new(
        ContentTables.SelectMany(t => new[] { $"GET api/{t}", $"GET api/{t}/{{id:int}}" })
            .Concat(new[] { "GET api/site-settings", "POST api/site-settings/email", "POST api/contact", "POST api/ask", "GET /health" }));

    [Fact]
    public void Only_the_expected_endpoints_are_public()
    {
        var endpoints = _factory.Services.GetRequiredService<EndpointDataSource>().Endpoints
            .OfType<RouteEndpoint>();

        var publicOnes = new HashSet<string>();
        foreach (var e in endpoints)
        {
            // Public = marked [AllowAnonymous]; everything else falls back to the admin rule.
            if (e.Metadata.GetMetadata<IAllowAnonymous>() is null) continue;
            var methods = e.Metadata.GetMetadata<HttpMethodMetadata>()?.HttpMethods ?? new[] { "GET" };
            foreach (var method in methods) publicOnes.Add($"{method} {e.RoutePattern.RawText}");
        }

        Assert.Equal(ExpectedPublic.OrderBy(x => x), publicOnes.OrderBy(x => x));
    }

    [Fact]
    public async Task Contact_form_works_without_signing_in()
    {
        var response = await _factory.CreateClient().PostAsJsonAsync("/api/contact",
            new { name = "Visitor", email = "visitor@example.com", message = "Hello" });

        Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.NotEqual(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Chatbot_is_reachable_without_signing_in()
    {
        // An empty question is refused as invalid (400), which proves the request got past auth.
        var response = await _factory.CreateClient().PostAsJsonAsync("/api/ask", new { question = "" });

        Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.NotEqual(HttpStatusCode.Forbidden, response.StatusCode);
    }
}
