// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using System.Net;
using System.Net.Http.Headers;
using System.Text;

namespace PortfolioApi.Tests;

/// <summary>
/// Proves the admin lock-down: every endpoint that changes data (or reads the inbox)
/// rejects visitors, other Supabase accounts, and the admin without the authenticator code.
/// If someone adds a write endpoint and forgets [Authorize], add it to WriteEndpoints and
/// these tests fail.
/// </summary>
public class AuthorizationTests : IClassFixture<TestApiFactory>
{
    private readonly TestApiFactory _factory;
    public AuthorizationTests(TestApiFactory factory) => _factory = factory;

    private static readonly string[] ContentTables =
    {
        "experiences", "projects", "skill-categories", "skills",
        "certifications", "education", "guides",
    };

    /// <summary>Every admin-only endpoint: (method, path).</summary>
    public static IEnumerable<object[]> WriteEndpoints()
    {
        foreach (var table in ContentTables)
        {
            yield return new object[] { "POST", $"/api/{table}" };
            yield return new object[] { "PUT", $"/api/{table}/999" };
            yield return new object[] { "DELETE", $"/api/{table}/999" };
            yield return new object[] { "PUT", $"/api/{table}/order" };
        }
        yield return new object[] { "PUT", "/api/site-settings" };
        yield return new object[] { "GET", "/api/site-settings/full" };
        yield return new object[] { "GET", "/api/contact" };
        yield return new object[] { "PATCH", "/api/contact/999" };
        yield return new object[] { "DELETE", "/api/contact/999" };
        yield return new object[] { "POST", "/api/knowledge/reindex" };
        yield return new object[] { "GET", "/api/knowledge/status" };
        yield return new object[] { "GET", "/api/system-log" };
        yield return new object[] { "PATCH", "/api/system-log/999" };
        yield return new object[] { "DELETE", "/api/system-log/999" };
        yield return new object[] { "DELETE", "/api/system-log/resolved" };
    }

    public static IEnumerable<object[]> PublicReads()
    {
        foreach (var table in ContentTables) yield return new object[] { $"/api/{table}" };
        yield return new object[] { "/api/site-settings" };
        yield return new object[] { "/health" };
    }

    private async Task<HttpResponseMessage> Send(string method, string path, string? token)
    {
        var client = _factory.CreateClient();
        var request = new HttpRequestMessage(new HttpMethod(method), path);
        if (method is "POST" or "PUT" or "PATCH")
            request.Content = new StringContent("{}", Encoding.UTF8, "application/json");
        if (token is not null)
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return await client.SendAsync(request);
    }

    [Theory]
    [MemberData(nameof(WriteEndpoints))]
    public async Task Visitor_without_token_gets_401(string method, string path)
    {
        var response = await Send(method, path, token: null);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Theory]
    [MemberData(nameof(WriteEndpoints))]
    public async Task Tampered_or_foreign_token_gets_401(string method, string path)
    {
        // Signed with a different key, like a token from someone else's Supabase project.
        var forged = TestApiFactory.Token(TestApiFactory.AdminEmail)[..^4] + "AAAA";
        var response = await Send(method, path, forged);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Theory]
    [MemberData(nameof(WriteEndpoints))]
    public async Task Other_signed_in_user_gets_403(string method, string path)
    {
        var response = await Send(method, path, TestApiFactory.Token("someone@else.com"));
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Theory]
    [MemberData(nameof(WriteEndpoints))]
    public async Task Admin_without_authenticator_code_gets_403(string method, string path)
    {
        var response = await Send(method, path, TestApiFactory.Token(TestApiFactory.AdminEmail, aal: "aal1"));
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Theory]
    [MemberData(nameof(WriteEndpoints))]
    public async Task Admin_with_authenticator_code_gets_past_the_lock(string method, string path)
    {
        var response = await Send(method, path, TestApiFactory.Token(TestApiFactory.AdminEmail));
        // Not 401/403: the request reached the endpoint (404/400/2xx depending on the body).
        Assert.NotEqual(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.NotEqual(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Theory]
    [MemberData(nameof(PublicReads))]
    public async Task Public_reads_work_without_a_token(string path)
    {
        var response = await Send("GET", path, token: null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
