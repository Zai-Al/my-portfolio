// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using System.ComponentModel.DataAnnotations;
namespace PortfolioApi.Models;

public class SkillCategory : IOrderedEntity
{
    public int Id { get; set; }
    [Required] public string Name { get; set; } = "";
    public string Icon { get; set; } = "FaCode";
    public int SortOrder { get; set; }
    public List<Skill> Skills { get; set; } = new();
}
