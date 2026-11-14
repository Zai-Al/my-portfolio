// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using Microsoft.Extensions.Diagnostics.HealthChecks;
using PortfolioApi.Data;

namespace PortfolioApi.Health;

/// <summary>Healthy when the API can reach the database. Used by GET /health.</summary>
public class DatabaseHealthCheck : IHealthCheck
{
    private readonly AppDbContext _db;
    public DatabaseHealthCheck(AppDbContext db) => _db = db;

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            return await _db.Database.CanConnectAsync(cancellationToken)
                ? HealthCheckResult.Healthy()
                : HealthCheckResult.Unhealthy("Database unreachable");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Database unreachable", ex);
        }
    }
}
