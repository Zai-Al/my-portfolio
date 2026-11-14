// Copyright (c) 2026 Zainab Alawi. All rights reserved.

namespace PortfolioApi.Models;

/// <summary>Single row (Id = 1) holding profile-level content.</summary>
public class SiteSettings
{
    public int Id { get; set; } = 1;
    public string? FullName { get; set; }
    public string? Headline { get; set; }
    public string? Bio { get; set; }
    public string? Location { get; set; }
    public string? Availability { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? LinkedInUrl { get; set; }
    public string? GithubUrl { get; set; }
    public string? CvUrl { get; set; }
    public string? ProfileImageUrl { get; set; }
    public string? HeroQuote { get; set; }
    public List<string> SoftSkills { get; set; } = new();
    public List<string> SpokenLanguages { get; set; } = new();
}
