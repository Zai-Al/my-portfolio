// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using System.ComponentModel.DataAnnotations;
namespace PortfolioApi.Models;

/// <summary>Knowledge-base entry the chatbot answers from (how to use the site and projects).</summary>
public class Guide : IOrderedEntity
{
    public int Id { get; set; }
    [Required] public string Title { get; set; } = "";
    [Required] public string Answer { get; set; } = "";
    public List<string> Keywords { get; set; } = new();
    public int SortOrder { get; set; }

    public string? TitleAr { get; set; } // Arabic title, used as a starter question on /ar
}
