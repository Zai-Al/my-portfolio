// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using System.ComponentModel.DataAnnotations;
namespace PortfolioApi.Models;

public class Project : IOrderedEntity
{
    public int Id { get; set; }
    [Required] public string Title { get; set; } = "";
    [Required] public string Slug { get; set; } = "";
    public string Summary { get; set; } = "";
    public string Description { get; set; } = "";
    public string? Context { get; set; }   // e.g. "Senior Project · Bahrain Polytechnic"
    public string? MyRole { get; set; }    // what I personally did
    public List<string> Highlights { get; set; } = new();
    public List<string> Tech { get; set; } = new();
    public List<string> Screenshots { get; set; } = new(); // image URLs
    public string Icon { get; set; } = "FaProjectDiagram";
    public string? RepoUrl { get; set; }
    public string? DemoUrl { get; set; }
    public string? DemoNotes { get; set; } // e.g. demo login instructions
    public string? Year { get; set; }
    public bool Featured { get; set; }
    public int SortOrder { get; set; }
}
