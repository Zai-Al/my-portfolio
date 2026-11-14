// Copyright (c) 2026 Zainab Alawi. All rights reserved.

namespace PortfolioApi.Services.Gemini;

/// <summary>The "Gemini" config section (user-secrets locally, Gemini__* env vars on Render).</summary>
public class GeminiOptions
{
    public const string Section = "Gemini";

    public string? ApiKey { get; set; }

    /// <summary>Tried first. Change it in config when Google retires a model; no code change needed.</summary>
    public string Model { get; set; } = "gemini-3.5-flash-lite";

    /// <summary>Tried when the first model is busy (503) or rate-limited (429).</summary>
    public string FallbackModel { get; set; } = "gemini-3.8-flash";

    /// <summary>
    /// Turns text into vectors for the AI guide. Its output is cut to
    /// KnowledgeChunk.EmbeddingDimensions (768) to match the database column. Changing the
    /// model means rebuilding the AI knowledge (old and new vectors aren't comparable).
    /// </summary>
    public string EmbeddingModel { get; set; } = "gemini-embedding-001";
}
