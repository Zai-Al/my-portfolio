// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PortfolioApi.Data;
using PortfolioApi.Models;

namespace PortfolioApi.Tests;

/// <summary>PUT /api/{table}/order: the up/down buttons in the admin portal.</summary>
public class ReorderTests : IClassFixture<TestApiFactory>
{
    private readonly TestApiFactory _factory;
    public ReorderTests(TestApiFactory factory) => _factory = factory;

    private async Task<int[]> SeedGuides(params string[] titles)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var guides = titles.Select((t, i) => new Guide { Title = t, Answer = "a", SortOrder = i }).ToList();
        db.Guides.AddRange(guides);
        await db.SaveChangesAsync();
        return guides.Select(g => g.Id).ToArray();
    }

    private async Task<Dictionary<int, int>> SortOrders(int[] ids)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await db.Guides.AsNoTracking().Where(g => ids.Contains(g.Id))
            .ToDictionaryAsync(g => g.Id, g => g.SortOrder);
    }

    private Task<HttpResponseMessage> PutOrder(int[] ids)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestApiFactory.Token(TestApiFactory.AdminEmail));
        return client.PutAsJsonAsync("/api/guides/order", ids);
    }

    [Fact]
    public async Task Renumbers_rows_in_the_given_order()
    {
        var ids = await SeedGuides("a", "b", "c");

        var response = await PutOrder(new[] { ids[2], ids[0], ids[1] });

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        var order = await SortOrders(ids);
        Assert.Equal(0, order[ids[2]]);
        Assert.Equal(1, order[ids[0]]);
        Assert.Equal(2, order[ids[1]]);
    }

    [Fact]
    public async Task Unknown_id_changes_nothing()
    {
        var ids = await SeedGuides("x", "y");

        var response = await PutOrder(new[] { ids[1], 999_999 });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var order = await SortOrders(ids);
        Assert.Equal(0, order[ids[0]]);
        Assert.Equal(1, order[ids[1]]);
    }

    [Theory]
    [InlineData(new int[0])]
    [InlineData(new[] { 1, 1 })]
    public async Task Empty_or_repeated_ids_are_rejected(int[] ids)
    {
        var response = await PutOrder(ids);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
