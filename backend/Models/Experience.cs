// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using System.ComponentModel.DataAnnotations;
namespace PortfolioApi.Models;

public class Experience : IOrderedEntity
{
    public int Id { get; set; }
    [Required] public string Company { get; set; } = "";
    [Required] public string Role { get; set; } = "";
    public string? Department { get; set; }
    public string? Location { get; set; }
    [Required] public string StartDate { get; set; } = "";
    public string? EndDate { get; set; } // null = present
    public string Summary { get; set; } = "";
    public List<string> Bullets { get; set; } = new();
    public List<string> Tech { get; set; } = new();
    public string Icon { get; set; } = "FaBriefcase"; // react-icons component name
    public string? ProofImageUrl { get; set; }        // shown when the visitor clicks "View"
    public int SortOrder { get; set; }
}
