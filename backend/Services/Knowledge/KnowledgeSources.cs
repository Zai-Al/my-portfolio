// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using System.Text;
using Microsoft.EntityFrameworkCore;
using PortfolioApi.Data;
using PortfolioApi.Models;

namespace PortfolioApi.Services.Knowledge;

/// <summary>
/// Turns every content row the AI guide may answer from into plain-text chunks
/// (without embeddings). Reads the same tables the site displays, so answers never
/// drift from what's on the page. Admin-only data (the contact inbox) is never included.
/// </summary>
public static class KnowledgeSources
{
    /// <summary>Entity types whose changes make the knowledge out of date.</summary>
    public static readonly IReadOnlySet<Type> SourceEntityTypes = new HashSet<Type>
    {
        typeof(SiteSettings), typeof(Experience), typeof(Education), typeof(Certification),
        typeof(SkillCategory), typeof(Skill), typeof(Project), typeof(Guide),
    };

    // Source types, also sent to the widget with each source link.
    public const string Profile = "profile";
    public const string Contact = "contact";
    public const string Experience = "experience";
    public const string Education = "education";
    public const string Certification = "certification";
    public const string Skills = "skills";
    public const string Project = "project";
    public const string Guide = "guide";

    private record Document(string Type, int Id, string Title, string? Anchor, string? Body);

    public static async Task<List<KnowledgeChunk>> BuildChunksAsync(AppDbContext db, CancellationToken ct = default)
    {
        var docs = new List<Document>();

        var s = await db.SiteSettings.AsNoTracking().FirstOrDefaultAsync(x => x.Id == 1, ct);
        if (s is not null)
        {
            var name = string.IsNullOrWhiteSpace(s.FullName) ? "the site owner" : s.FullName;
            docs.Add(new(Profile, 1, $"About {name}", "#about", Lines(
                Field("Name", s.FullName),
                Field("Headline", s.Headline),
                Field("Bio", s.Bio),
                Field("Based in", s.Location),
                Field("Availability", s.Availability),
                List("Soft skills", s.SoftSkills),
                List("Spoken languages", s.SpokenLanguages))));
            docs.Add(new(Contact, 1, "Contact details and CV", "#contact", Lines(
                // No email or phone here: anything in the AI's knowledge can be asked for and
                // scraped. Visitors get the email from the "Show email" button (spam-checked).
                string.IsNullOrWhiteSpace(s.Email)
                    ? null
                    : "Email: not shared in this chat (to keep it away from spam bots). Click \"Show email\" in the Contact section, or use the contact form.",
                Field("LinkedIn", s.LinkedInUrl),
                Field("GitHub", s.GithubUrl),
                Field("Availability", s.Availability),
                string.IsNullOrWhiteSpace(s.CvUrl)
                    ? "CV: not uploaded yet."
                    : "CV: downloadable from the Contact section, or by typing `curl resume.pdf` in the terminal at the top of the home page.",
                "There is also a contact form in the Contact section.")));
        }

        foreach (var e in await db.Experiences.AsNoTracking().OrderBy(x => x.SortOrder).ToListAsync(ct))
            docs.Add(new(Experience, e.Id, $"{e.Role} at {e.Company}", "#experience", Lines(
                $"{e.Role} at {e.Company}",
                Field("Department", e.Department),
                Field("Location", e.Location),
                $"Dates: {e.StartDate} – {e.EndDate ?? "present"}",
                Field("Summary", e.Summary),
                Bullets(e.Bullets),
                List("Tech used", e.Tech))));

        foreach (var e in await db.Education.AsNoTracking().OrderBy(x => x.SortOrder).ToListAsync(ct))
            docs.Add(new(Education, e.Id, $"{e.Degree}, {e.Institution}", "#education", Lines(
                $"{e.Degree} at {e.Institution}",
                Field("Location", e.Location),
                $"Dates: {e.StartDate} – {e.EndDate ?? "present"}",
                List("Awards", e.Awards))));

        foreach (var c in await db.Certifications.AsNoTracking().OrderBy(x => x.SortOrder).ToListAsync(ct))
            docs.Add(new(Certification, c.Id, c.Name, "#certifications", Lines(
                $"Certification: {c.Name}, issued by {c.Issuer}",
                Field("Issued", c.IssueDate),
                Field("Expires", c.ExpiryDate),
                Field("Credential ID", c.CredentialId),
                Field("Verify at", c.CredentialUrl))));

        foreach (var cat in await db.SkillCategories.AsNoTracking().Include(x => x.Skills)
                     .OrderBy(x => x.SortOrder).ToListAsync(ct))
            docs.Add(new(Skills, cat.Id, $"Skills: {cat.Name}", "#skills", Lines(
                $"Skill category: {cat.Name}",
                Lines(cat.Skills.OrderBy(k => k.SortOrder).Select(k =>
                    k.Includes.Count > 0 ? $"- {k.Name} (includes {string.Join(", ", k.Includes)})" : $"- {k.Name}")
                    .ToArray()))));

        foreach (var p in await db.Projects.AsNoTracking().OrderBy(x => x.SortOrder).ToListAsync(ct))
            docs.Add(new(Project, p.Id, p.Title, $"#project-{p.Slug}", Lines(
                $"Project: {p.Title}",
                Field("Context", p.Context),
                Field("Year", p.Year),
                Field("Summary", p.Summary),
                Field("Description", p.Description),
                Field("Challenge", p.Challenge),
                Field("My role", p.MyRole),
                Field("What I learned", p.Learned),
                Bullets(p.Highlights),
                List("Tech", p.Tech),
                // Only links the admin chose to show; a hidden repo is mentioned, never linked.
                Field("Source code", p.PublicRepoUrl() ?? (string.IsNullOrWhiteSpace(p.RepoUrl) ? null : "private (not shared publicly)")),
                Field("Live demo", p.PublicDemoUrl()),
                Field("Demo notes", p.DemoNotes),
                p.Screenshots.Count > 0 ? $"Screenshots: {p.Screenshots.Count}, shown in the project's details popup." : null)));

        foreach (var g in await db.Guides.AsNoTracking().OrderBy(x => x.SortOrder).ToListAsync(ct))
            docs.Add(new(Guide, g.Id, g.Title, null, Lines(
                $"Q: {g.Title}",
                $"A: {g.Answer}",
                List("Keywords", g.Keywords))));

        var chunks = new List<KnowledgeChunk>();
        foreach (var d in docs)
        {
            var pieces = TextChunker.Split(d.Body ?? "", TextChunker.MaxLength);
            for (var i = 0; i < pieces.Count; i++)
                chunks.Add(new KnowledgeChunk
                {
                    SourceType = d.Type,
                    SourceId = d.Id,
                    ChunkIndex = i,
                    Title = d.Title,
                    Anchor = d.Anchor,
                    // Each piece repeats its title, so a lone piece still says what it's about.
                    Content = i == 0 ? pieces[i] : $"({d.Title}, continued)\n{pieces[i]}",
                });
        }
        return chunks;
    }

    /// <summary>"Projects section → Sample Shop → View details": the place the AI should point to.</summary>
    public static string? WhereOnSite(KnowledgeChunk c) => c.SourceType switch
    {
        Profile => "About section",
        Contact => "Contact section",
        Experience => "Experience section",
        Education => "Education section",
        Certification => "Certifications section",
        Skills => "Skills section",
        Project => $"Projects section → {c.Title} → View details",
        _ => null,
    };

    private static string? Field(string label, string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : $"{label}: {value.Trim()}";

    private static string? List(string label, IEnumerable<string> values)
    {
        var items = values.Where(v => !string.IsNullOrWhiteSpace(v)).Select(v => v.Trim()).ToList();
        return items.Count == 0 ? null : $"{label}: {string.Join(", ", items)}";
    }

    private static string? Bullets(IEnumerable<string> values) =>
        Lines(values.Where(v => !string.IsNullOrWhiteSpace(v)).Select(v => $"- {v.Trim()}").ToArray());

    private static string? Lines(params string?[] lines)
    {
        var sb = new StringBuilder();
        foreach (var l in lines)
            if (!string.IsNullOrWhiteSpace(l)) sb.AppendLine(l);
        return sb.Length == 0 ? null : sb.ToString().TrimEnd();
    }
}
