// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortfolioApi.Data;
using PortfolioApi.Models;

namespace PortfolioApi.Controllers;

/// <summary>
/// Shared CRUD for content tables: anyone can read (ordered by SortOrder),
/// only the admin can create, update or delete. A table can define what "the same record"
/// means (<see cref="IsDuplicate"/>); saving one then returns 409 with a readable message.
/// </summary>
[ApiController]
public abstract class OrderedCrudController<T> : ControllerBase where T : class, IOrderedEntity
{
    protected readonly AppDbContext Db;
    protected OrderedCrudController(AppDbContext db) => Db = db;

    protected DbSet<T> Set => Db.Set<T>();

    /// <summary>
    /// The duplicate rule for this table: true when <paramref name="candidate"/> (being saved)
    /// is the same record as <paramref name="existing"/>. Null = no check. Compare text with
    /// <see cref="Same"/> so case and extra spaces don't matter.
    /// </summary>
    protected virtual Func<T, T, bool>? IsDuplicate => null;

    /// <summary>The "already exists" message shown in the admin portal.</summary>
    protected virtual string DuplicateMessage(T candidate, T existing) => "A matching entry already exists.";

    /// <summary>Same text, ignoring upper/lower case and extra spaces.</summary>
    protected static bool Same(string? a, string? b) => Normalize(a) == Normalize(b);

    /// <summary>Like <see cref="Same"/>, but an empty value never matches.</summary>
    protected static bool SameAndFilled(string? a, string? b) => Normalize(a) != "" && Same(a, b);

    private static string Normalize(string? s) =>
        string.Join(' ', (s ?? "").Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries)).ToLowerInvariant();

    /// <summary>409 with a message when another row is the same record; null when it's fine to save.</summary>
    private async Task<IActionResult?> RejectDuplicate(T candidate, int ownId)
    {
        if (IsDuplicate is not { } rule) return null;
        // Content tables are small (tens of rows), so the rule runs in memory: simple, and the
        // same comparison on every database provider.
        var others = await Set.AsNoTracking().Where(e => e.Id != ownId).ToListAsync();
        var match = others.FirstOrDefault(e => rule(candidate, e));
        return match is null
            ? null
            : Problem(title: "Already exists", detail: DuplicateMessage(candidate, match),
                statusCode: StatusCodes.Status409Conflict);
    }

    [HttpGet]
    [AllowAnonymous] // the site reads its content without signing in
    public virtual async Task<IActionResult> GetAll() =>
        Ok(await Set.AsNoTracking().OrderBy(e => e.SortOrder).ThenBy(e => e.Id).ToListAsync());

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public virtual async Task<IActionResult> GetById(int id)
    {
        var entity = await Set.AsNoTracking().FirstOrDefaultAsync(e => e.Id == id);
        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public virtual async Task<IActionResult> Create(T entity)
    {
        entity.Id = 0; // let the database assign the id
        if (await RejectDuplicate(entity, 0) is { } conflict) return conflict;
        Set.Add(entity);
        await Db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, entity);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "AdminOnly")]
    public virtual async Task<IActionResult> Update(int id, T updated)
    {
        var existing = await Set.FindAsync(id);
        if (existing is null) return NotFound();

        updated.Id = id; // the route id is authoritative, not whatever the body sent
        if (await RejectDuplicate(updated, id) is { } conflict) return conflict; // never clashes with itself
        Db.Entry(existing).CurrentValues.SetValues(updated);
        await Db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>
    /// Sets SortOrder to 0, 1, 2… following the given ids, in one save, so a move
    /// never leaves two rows half-swapped. Rows not listed keep their SortOrder
    /// (skills are reordered one category at a time).
    /// </summary>
    [HttpPut("order")]
    [Authorize(Policy = "AdminOnly")]
    public virtual async Task<IActionResult> Reorder([FromBody] int[] ids)
    {
        if (ids.Length == 0 || ids.Length > 1000 || ids.Distinct().Count() != ids.Length)
            return ValidationProblem("Send each id once, in the new order.");

        var rows = await Set.Where(e => ids.Contains(e.Id)).ToListAsync();
        if (rows.Count != ids.Length) return NotFound();

        var position = ids.Select((id, i) => (id, i)).ToDictionary(p => p.id, p => p.i);
        foreach (var row in rows) row.SortOrder = position[row.Id];
        await Db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "AdminOnly")]
    public virtual async Task<IActionResult> Delete(int id)
    {
        var existing = await Set.FindAsync(id);
        if (existing is null) return NotFound();
        Set.Remove(existing);
        await Db.SaveChangesAsync();
        return NoContent();
    }
}
