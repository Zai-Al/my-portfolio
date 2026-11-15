// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using PortfolioApi.Data;
using PortfolioApi.Services.Turnstile;

namespace PortfolioApi.Tests;

/// <summary>
/// Runs the real API in memory, with two swaps: an in-memory database instead of Supabase,
/// and tokens signed by a test key instead of Supabase Auth. Everything else (routes,
/// the AdminOnly policy, rate limits) is the production code.
/// </summary>
public class TestApiFactory : WebApplicationFactory<Program>
{
    public const string AdminEmail = "admin@test.local";
    private const string Issuer = "https://test.supabase.local/auth/v1";
    private static readonly SymmetricSecurityKey SigningKey =
        new(Encoding.UTF8.GetBytes("test-signing-key-for-integration-tests-only-0123456789"));

    private readonly string _databaseName = $"tests-{Guid.NewGuid()}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Not "Development": no user-secrets are loaded, so tests never see real credentials.
        builder.UseEnvironment("Testing");
        builder.UseSetting("ConnectionStrings:DefaultConnection", "Host=localhost;Database=unused");
        builder.UseSetting("Supabase:Url", "https://test.supabase.local");
        builder.UseSetting("Supabase:AdminEmail", AdminEmail);
        builder.UseSetting("Supabase:RequireMfa", "true");
        // No background AI knowledge rebuild (it would call Gemini; tests have no key anyway).
        builder.UseSetting("Knowledge:RebuildOnStartup", "false");

        builder.ConfigureServices(services =>
        {
            // Swap Postgres for an in-memory database.
            // (EF Core 9+ also registers the provider setup as IDbContextOptionsConfiguration.)
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<DbContextOptions>();
            services.RemoveAll<IDbContextOptionsConfiguration<AppDbContext>>();
            services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(_databaseName));

            // Never call Cloudflare: a fake Turnstile that only accepts FakeTurnstile.ValidToken.
            services.RemoveAll<ITurnstileVerifier>();
            services.AddSingleton<ITurnstileVerifier, FakeTurnstile>();

            // Validate tokens with the test key instead of fetching Supabase's signing keys.
            services.PostConfigure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, o =>
            {
                o.Authority = null;
                o.MetadataAddress = null!;
                o.Configuration = new OpenIdConnectConfiguration { Issuer = Issuer };
                // Never try to download signing keys (a bad token would otherwise wait for a timeout).
                o.ConfigurationManager = null;
                o.RefreshOnIssuerKeyNotFound = false;
                o.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidIssuer = Issuer,
                    ValidAudience = "authenticated",
                    IssuerSigningKey = SigningKey,
                };
            });
        });
    }

    /// <summary>A Supabase-style access token. aal2 = password + authenticator code.</summary>
    public static string Token(string email, string aal = "aal2")
    {
        var handler = new JsonWebTokenHandler();
        return handler.CreateToken(new SecurityTokenDescriptor
        {
            Issuer = Issuer,
            Audience = "authenticated",
            Expires = DateTime.UtcNow.AddMinutes(10),
            Subject = new ClaimsIdentity(new[] { new Claim("email", email), new Claim("aal", aal) }),
            SigningCredentials = new SigningCredentials(SigningKey, SecurityAlgorithms.HmacSha256),
        });
    }
}

/// <summary>Stands in for Cloudflare: one token passes (for the right action), everything else fails.</summary>
public class FakeTurnstile : ITurnstileVerifier
{
    public const string ValidToken = "passed-the-challenge";

    public Task<bool> VerifyAsync(string token, string expectedAction, string? remoteIp, CancellationToken ct = default) =>
        Task.FromResult(token == ValidToken && expectedAction == "reveal-email");
}

internal static class ServiceCollectionExtensions
{
    public static void RemoveAll<T>(this IServiceCollection services)
    {
        foreach (var d in services.Where(d => d.ServiceType == typeof(T)).ToList()) services.Remove(d);
    }
}
