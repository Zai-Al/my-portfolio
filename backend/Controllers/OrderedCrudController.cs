// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortfolioApi.Data;
using PortfolioApi.Models;

namespace PortfolioApi.Controllers;

/// <summary>
/// Shared CRUD for content tables: anyone can read (ordered by SortOrder),
/// only the admin can create, update or delete.
/// </summary>
[ApiController]
public abstract class OrderedCrudController<T> : ControllerBase where T : class, IOrderedEntity
{
    protected readonly AppDbContext Db;
    protected OrderedCrudController(AppDbContext db) => Db = db;

    protected DbSet<T> Set => Db.Set<T>();

    [HttpGet]
    public virtual async Task<IActionResult> GetAll() =>
        Ok(await Set.AsNoTracking().OrderBy(e => e.SortOrder).ThenBy(e => e.Id).ToListAsync());

    [HttpGet("{id:int}")]
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
