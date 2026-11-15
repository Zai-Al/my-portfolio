// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using Microsoft.AspNetCore.Mvc;
using PortfolioApi.Data;
using PortfolioApi.Models;

namespace PortfolioApi.Controllers;

[Route("api/certifications")]
public class CertificationsController : OrderedCrudController<Certification>
{
    public CertificationsController(AppDbContext db) : base(db) { }

    // Same credential ID (when both have one), or same name + issuer + issue date.
    // A renewal with a new issue date and a new ID is fine.
    protected override Func<Certification, Certification, bool>? IsDuplicate => (a, b) =>
        SameAndFilled(a.CredentialId, b.CredentialId) ||
        (Same(a.Name, b.Name) && Same(a.Issuer, b.Issuer) && Same(a.IssueDate, b.IssueDate));

    protected override string DuplicateMessage(Certification candidate, Certification existing) =>
        SameAndFilled(candidate.CredentialId, existing.CredentialId)
            ? $"Credential ID {existing.CredentialId} is already used by \"{existing.Name}\". Each certification has its own ID."
            : $"You already have \"{existing.Name}\" from {existing.Issuer}" +
              (string.IsNullOrWhiteSpace(existing.IssueDate) ? "." : $", issued {existing.IssueDate}.") +
              " Edit that entry instead, or change the name, issuer or issue date.";
}
