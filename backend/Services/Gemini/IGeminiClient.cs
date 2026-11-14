// Copyright (c) 2026 Zainab Alawi. All rights reserved.

namespace PortfolioApi.Services.Gemini;

public enum GeminiOutcome
{
    Ok,
    /// <summary>No API key configured.</summary>
    NotConfigured,
    /// <summary>Google's servers are overloaded (503).</summary>
    Busy,
    /// <summary>The free quota is used up (429); it resets daily.</summary>
    QuotaExceeded,
    /// <summary>Anything else: network error, bad request, unexpected reply.</summary>
    Failed,
}

/// <summary>One message in a conversation. Role is "user" or "model" (Gemini's names).</summary>
public record GeminiTurn(string Role, string Text);

/// <summary>
/// A streamed answer. When Outcome is Ok, read Chunks to the end (it owns the open HTTP
/// response and closes it when done); otherwise Chunks is empty.
/// </summary>
public record GeminiStream(GeminiOutcome Outcome, IAsyncEnumerable<string> Chunks);

/// <summary>Embeddings, one per input text, in the same order (only when Outcome is Ok).</summary>
public record GeminiEmbeddings(GeminiOutcome Outcome, IReadOnlyList<float[]> Vectors);

/// <summary>What the text being embedded is for; Gemini tunes the vector to the task.</summary>
public enum EmbeddingTask { Document, Query }

/// <summary>Google Gemini: streamed answers and text embeddings.</summary>
public interface IGeminiClient
{
    /// <summary>Starts a streamed answer. Tries the main model, then the fallback if the first is busy.</summary>
    Task<GeminiStream> StreamAsync(string systemInstruction, IReadOnlyList<GeminiTurn> contents,
        CancellationToken cancellationToken = default);

    /// <summary>Embeds up to 100 texts in one call.</summary>
    Task<GeminiEmbeddings> EmbedAsync(IReadOnlyList<string> texts, EmbeddingTask task,
        CancellationToken cancellationToken = default);
}
