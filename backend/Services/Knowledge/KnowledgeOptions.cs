// Copyright (c) 2026 Zainab Alawi. All rights reserved.

namespace PortfolioApi.Services.Knowledge;

/// <summary>
/// The "Knowledge" config section: how the AI knowledge rebuild paces its Gemini calls.
/// The defaults stay well under the Gemini free tier (about 100 embeddings a minute).
/// </summary>
public class KnowledgeOptions
{
    public const string Section = "Knowledge";

    /// <summary>Texts embedded per Gemini call.</summary>
    public int EmbedBatchSize { get; set; } = 20;

    /// <summary>Pause between embedding calls (20 texts every 20 s = 60 a minute).</summary>
    public int EmbedBatchDelaySeconds { get; set; } = 20;

    /// <summary>Wait this long after a save before rebuilding, so a burst of saves becomes one rebuild.</summary>
    public int DebounceSeconds { get; set; } = 5;

    /// <summary>Rebuild once when the API starts (cheap: unchanged text isn't re-embedded).</summary>
    public bool RebuildOnStartup { get; set; } = true;
}
