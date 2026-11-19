// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace PortfolioApi.Models;

public class Skill : IOrderedEntity
{
    public int Id { get; set; }
    [Required] public string Name { get; set; } = "";
    public int SkillCategoryId { get; set; }
    [JsonIgnore] public SkillCategory? SkillCategory { get; set; }
    public string Icon { get; set; } = "FaCode";
    public List<string> Includes { get; set; } = new(); // shown on hover
    public int SortOrder { get; set; }

    // Arabic versions (shown on /ar; empty = fall back to the English field).
    public string? NameAr { get; set; }
    public List<string> IncludesAr { get; set; } = new();
}
