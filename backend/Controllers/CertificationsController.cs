// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using Microsoft.AspNetCore.Mvc;
using PortfolioApi.Data;
using PortfolioApi.Models;

namespace PortfolioApi.Controllers;

[Route("api/certifications")]
public class CertificationsController : OrderedCrudController<Certification>
{
    public CertificationsController(AppDbContext db) : base(db) { }
}
