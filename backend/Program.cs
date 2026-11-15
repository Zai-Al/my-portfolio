// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using PortfolioApi.Data;
using PortfolioApi.Health;
using PortfolioApi.Services.Knowledge;
using PortfolioApi.Services.Gemini;

var builder = WebApplication.CreateBuilder(args);

// --- Database ---
// Supabase's session pooler allows only 15 clients in total, shared by every running
// copy of this API (local + Render). Without a cap, Npgsql opens up to 100 and keeps idle
// ones for 5 minutes, so a burst of page loads hits the limit and requests fail.
// Capped here, extra requests wait briefly for a free connection instead of failing.
var connectionString = new NpgsqlConnectionStringBuilder(
    builder.Configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is not configured."))
{
    MaxPoolSize = builder.Configuration.GetValue("Database:MaxPoolSize", 5),
    ConnectionIdleLifetime = 60, // seconds; give idle connections back to the pooler sooner
}.ConnectionString;
// UseVector: pgvector support (the AI guide's embeddings). The interceptor queues an AI
// knowledge rebuild whenever a save changes content the chatbot answers from.
builder.Services.AddSingleton<KnowledgeIndexQueue>();
builder.Services.AddSingleton<KnowledgeChangeInterceptor>();
builder.Services.AddDbContext<AppDbContext>((services, options) => options
    .UseNpgsql(connectionString, npgsql => npgsql.UseVector())
    .AddInterceptors(services.GetRequiredService<KnowledgeChangeInterceptor>()));

// --- Auth: Supabase Auth (single admin user, created directly in the Supabase dashboard) ---
// The frontend signs in via supabase-js and sends the resulting access token as a
// Bearer token; we verify it was issued by our Supabase project AND that it belongs
// to the one admin account - Supabase projects allow public sign-up by default, so
// "issued by our project" alone is NOT enough to prove someone is the site owner.
var supabaseUrl = builder.Configuration["Supabase:Url"]
    ?? throw new InvalidOperationException("Supabase:Url is not configured.");
supabaseUrl = supabaseUrl.TrimEnd('/');
var adminEmail = builder.Configuration["Supabase:AdminEmail"]
    ?? throw new InvalidOperationException("Supabase:AdminEmail is not configured.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Authority alone is enough - JwtBearerHandler derives the standard
        // OIDC metadata URL ({Authority}/.well-known/openid-configuration)
        // from it, so we don't need to hand-build that path ourselves.
        options.Authority = $"{supabaseUrl}/auth/v1";
        options.Audience = builder.Configuration["Supabase:Audience"] ?? "authenticated";
        // Keep raw claim names ("email") instead of the legacy ClaimTypes remap.
        options.MapInboundClaims = false;
    });
// Two-factor: Supabase sets "aal" = "aal2" only after the authenticator-app code
// is verified, so a stolen password alone can't write anything. Escape hatch
// (e.g. lost phone): set Supabase__RequireMfa=false in Render, fix, set it back.
var requireMfa = builder.Configuration.GetValue("Supabase:RequireMfa", true);
builder.Services.AddAuthorization(options =>
{
    void Admin(Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder policy)
    {
        policy.RequireAuthenticatedUser().RequireClaim("email", adminEmail);
        if (requireMfa) policy.RequireClaim("aal", "aal2");
    }
    options.AddPolicy("AdminOnly", Admin);

    // Secure by default: any endpoint without its own [Authorize] or [AllowAnonymous] gets the
    // admin rule, so a forgotten attribute locks an endpoint instead of exposing it.
    // Public endpoints say so with [AllowAnonymous].
    var fallback = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder();
    Admin(fallback);
    options.FallbackPolicy = fallback.Build();
});

// --- Client IPs behind Render's proxy (needed for per-IP rate limits) ---
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    // Render's proxy address isn't fixed; trust the one hop it adds.
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
    options.ForwardLimit = 1;
});

// --- Rate limits: the contact form and the AI chat are the only public writes ---
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("contact", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(10),
                QueueLimit = 0,
            }));
    // AI chat: 10 questions a minute and 100 a day per visitor. Stops one person (or bot)
    // from using up the shared free Gemini quota for everyone.
    options.AddPolicy("ask", context =>
        RateLimitPartition.Get(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => RateLimiter.CreateChained(
                new FixedWindowRateLimiter(new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 10, Window = TimeSpan.FromMinutes(1), QueueLimit = 0, AutoReplenishment = true,
                }),
                new FixedWindowRateLimiter(new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 100, Window = TimeSpan.FromDays(1), QueueLimit = 0, AutoReplenishment = true,
                }))));
});

// --- CORS: allow the deployed frontend to call this API ---
var allowedOrigin = builder.Configuration["FrontendOrigin"] ?? "http://localhost:3000";
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(allowedOrigin).AllowAnyHeader().AllowAnyMethod());
});

// --- AI guide (RAG): Gemini client, knowledge rebuilds in the background, retrieval ---
builder.Services.Configure<GeminiOptions>(builder.Configuration.GetSection(GeminiOptions.Section));
builder.Services.Configure<KnowledgeOptions>(builder.Configuration.GetSection(KnowledgeOptions.Section));
builder.Services.AddHttpClient<IGeminiClient, GeminiClient>(client => client.Timeout = TimeSpan.FromSeconds(60));
builder.Services.AddScoped<KnowledgeIndexer>();
builder.Services.AddScoped<KnowledgeRetriever>();
builder.Services.AddHostedService<KnowledgeIndexWorker>();

// --- HSTS: browsers only talk to the API over HTTPS (2 years). Added to HTTPS responses
// outside Development; localhost is never included. ---
builder.Services.AddHsts(options =>
{
    options.MaxAge = TimeSpan.FromDays(730);
    options.IncludeSubDomains = true;
});

// --- Errors: unhandled exceptions become a plain ProblemDetails 500 (no stack traces) ---
builder.Services.AddProblemDetails();

// --- GET /health: is the API up and can it reach the database? (used by the keep-alive ping) ---
builder.Services.AddHealthChecks().AddCheck<DatabaseHealthCheck>("database");

// Only fields marked [Required] are mandatory; other strings may be left empty.
builder.Services.AddControllers(options =>
    options.SuppressImplicitRequiredAttributeForNonNullableReferenceTypes = true);

var app = builder.Build();

// Security headers on every response. The API only returns JSON, so nothing may frame it,
// guess its content type or load anything from it. Set when the response starts, so error
// responses (which clear headers) get them too.
app.Use((context, next) =>
{
    context.Response.OnStarting(() =>
    {
        var headers = context.Response.Headers;
        headers.XContentTypeOptions = "nosniff";
        headers.XFrameOptions = "DENY";
        headers["Referrer-Policy"] = "no-referrer";
        headers.ContentSecurityPolicy = "default-src 'none'; frame-ancestors 'none'";
        return Task.CompletedTask;
    });
    return next();
});

// In Development the detailed error page still shows; elsewhere visitors get a short ProblemDetails.
if (!app.Environment.IsDevelopment()) app.UseExceptionHandler();
app.UseForwardedHeaders(); // before anything that checks HTTPS or the client IP (HSTS, rate limits)
if (!app.Environment.IsDevelopment()) app.UseHsts();
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health").AllowAnonymous(); // public: used by the uptime monitor

app.Run();

// Lets the integration tests (tests/PortfolioApi.Tests) start this app in memory.
public partial class Program { }
