// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using System.ComponentModel.DataAnnotations.Schema;

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

    // Arabic versions (shown on /ar; empty = fall back to the English field).
    public string? FullNameAr { get; set; }
    public string? HeadlineAr { get; set; }
    public string? BioAr { get; set; }
    public string? LocationAr { get; set; }
    public string? AvailabilityAr { get; set; }
    public string? HeroQuoteAr { get; set; }
    public List<string> SoftSkillsAr { get; set; } = new();
    public List<string> SpokenLanguagesAr { get; set; } = new();

    /// <summary>
    /// Not stored. The public read leaves Email and Phone out (spam bots scrape them) and sets
    /// this instead, so the site knows whether to show the "Show email" button.
    /// </summary>
    [NotMapped]
    public bool HasEmail { get; set; }
}
