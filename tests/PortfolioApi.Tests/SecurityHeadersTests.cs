// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using System.Net;
using System.Net.Http.Json;

namespace PortfolioApi.Tests;

/// <summary>Every API response carries the security headers: success, refusal and not-found alike.</summary>
public class SecurityHeadersTests : IClassFixture<TestApiFactory>
{
    private readonly TestApiFactory _factory;
    public SecurityHeadersTests(TestApiFactory factory) => _factory = factory;

    private static void AssertSecurityHeaders(HttpResponseMessage response)
    {
        string Header(string name) =>
            response.Headers.TryGetValues(name, out var values) ? string.Join(",", values) : "";

        Assert.Equal("nosniff", Header("X-Content-Type-Options"));
        Assert.Equal("DENY", Header("X-Frame-Options"));
        Assert.Equal("no-referrer", Header("Referrer-Policy"));
        Assert.Equal("default-src 'none'; frame-ancestors 'none'", Header("Content-Security-Policy"));
    }

    [Theory]
    [InlineData("/health")]
    [InlineData("/api/projects")]
    [InlineData("/api/site-settings")]
    [InlineData("/api/does-not-exist")]
    public async Task Get_responses_have_security_headers(string path)
    {
        var response = await _factory.CreateClient().GetAsync(path);
        AssertSecurityHeaders(response);
    }

    [Fact]
    public async Task A_refused_admin_write_has_security_headers()
    {
        var response = await _factory.CreateClient().PostAsJsonAsync("/api/projects", new { });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        AssertSecurityHeaders(response);
    }
}
