// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using System.Text;
using System.Text.RegularExpressions;

namespace PortfolioApi.Services.Knowledge;

/// <summary>
/// Splits long text into pieces of about <see cref="MaxLength"/> characters, breaking
/// between lines first, then between sentences, and only mid-sentence as a last resort.
/// Small pieces make retrieval precise: a question about one bullet finds that bullet.
/// </summary>
public static partial class TextChunker
{
    public const int MaxLength = 800;

    public static List<string> Split(string text, int maxLength = MaxLength)
    {
        var chunks = new List<string>();
        var current = new StringBuilder();

        void Flush()
        {
            var s = current.ToString().Trim();
            if (s.Length > 0) chunks.Add(s);
            current.Clear();
        }

        foreach (var piece in Pieces(text, maxLength))
        {
            if (current.Length > 0 && current.Length + 1 + piece.Length > maxLength) Flush();
            if (current.Length > 0) current.Append('\n');
            current.Append(piece);
        }
        Flush();
        return chunks;
    }

    /// <summary>Lines, with any line longer than maxLength broken into sentences (then hard-cut).</summary>
    private static IEnumerable<string> Pieces(string text, int maxLength)
    {
        foreach (var raw in text.Replace("\r", "").Split('\n'))
        {
            var line = raw.Trim();
            if (line.Length == 0) continue;
            if (line.Length <= maxLength) { yield return line; continue; }

            var sentence = new StringBuilder();
            foreach (var s in SentenceEnd().Split(line))
            {
                if (sentence.Length > 0 && sentence.Length + 1 + s.Length > maxLength)
                {
                    yield return sentence.ToString();
                    sentence.Clear();
                }
                var rest = s;
                while (rest.Length > maxLength)
                {
                    yield return rest[..maxLength];
                    rest = rest[maxLength..];
                }
                if (sentence.Length > 0) sentence.Append(' ');
                sentence.Append(rest);
            }
            if (sentence.Length > 0) yield return sentence.ToString();
        }
    }

    [GeneratedRegex(@"(?<=[.!?])\s+")]
    private static partial Regex SentenceEnd();
}
