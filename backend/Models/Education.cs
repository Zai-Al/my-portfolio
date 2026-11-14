// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using System.ComponentModel.DataAnnotations;
namespace PortfolioApi.Models;

public class Education : IOrderedEntity
{
    public int Id { get; set; }
    [Required] public string Institution { get; set; } = "";
    [Required] public string Degree { get; set; } = "";
    public string? Location { get; set; }
    public string StartDate { get; set; } = "";
    public string? EndDate { get; set; }
    public List<string> Awards { get; set; } = new();
    public string Icon { get; set; } = "FaGraduationCap";
    public int SortOrder { get; set; }
}
