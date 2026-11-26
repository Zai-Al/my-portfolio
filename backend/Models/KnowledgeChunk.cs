// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using System.ComponentModel.DataAnnotations;
using Pgvector;
namespace PortfolioApi.Models;

/// <summary>
/// One searchable piece of site content for the AI guide (RAG). Rows are derived data:
/// the indexer rebuilds them from Guides, Projects, Experience, etc., so they are never
/// edited by hand. Embedding is null when Gemini couldn't embed it yet (keyword fallback).
/// </summary>
public class KnowledgeChunk
{
    public const int EmbeddingDimensions = 768;

    public int Id { get; set; }
    /// <summary>Which table the text came from, e.g. "guide", "project", "experience".</summary>
    [Required, MaxLength(32)] public string SourceType { get; set; } = "";
    /// <summary>Primary key of the source row (SiteSettings is always 1).</summary>
    public int SourceId { get; set; }
    /// <summary>Position of this chunk within its source row (long text is split into ~800-char chunks).</summary>
    public int ChunkIndex { get; set; }
    [Required] public string Title { get; set; } = "";
    [Required] public string Content { get; set; } = "";
    /// <summary>Where the widget links to, e.g. "#projects" or "/projects/sample-shop".</summary>
    public string? Anchor { get; set; }
    public Vector? Embedding { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
