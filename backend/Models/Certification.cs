// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using System.ComponentModel.DataAnnotations;
namespace PortfolioApi.Models;

public class Certification : IOrderedEntity
{
    public int Id { get; set; }
    [Required] public string Name { get; set; } = "";
    [Required] public string Issuer { get; set; } = "";
    public string IssueDate { get; set; } = "";
    public string? ExpiryDate { get; set; }
    public string? CredentialId { get; set; }
    public string? CredentialUrl { get; set; }
    public string? ImageUrl { get; set; } // certificate image shown in a popup
    public string Icon { get; set; } = "FaCertificate";
    public int SortOrder { get; set; }
}
