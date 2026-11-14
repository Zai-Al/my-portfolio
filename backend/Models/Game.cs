// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using System.ComponentModel.DataAnnotations;
namespace PortfolioApi.Models;

/// <summary>Card content for the "Just for fun" section. Slug matches a frontend component key.</summary>
public class Game : IOrderedEntity
{
    public int Id { get; set; }
    [Required] public string Slug { get; set; } = "";
    [Required] public string Title { get; set; } = "";
    public string Icon { get; set; } = "FaGamepad";
    public string Goal { get; set; } = "";
    public string Details { get; set; } = "";
    public List<string> HowToPlay { get; set; } = new();
    public int SortOrder { get; set; }
}
