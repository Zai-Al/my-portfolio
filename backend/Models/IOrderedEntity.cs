// Copyright (c) 2026 Zainab Alawi. All rights reserved.

namespace PortfolioApi.Models;

/// <summary>Shared shape for content rows that the site lists in a set order.</summary>
public interface IOrderedEntity
{
    int Id { get; set; }
    int SortOrder { get; set; }
}
