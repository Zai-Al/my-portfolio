// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using Microsoft.EntityFrameworkCore;
using PortfolioApi.Models;

namespace PortfolioApi.Data;

/// <summary>
/// Schema only. All portfolio content lives in the database and is managed
/// through the admin panel - nothing is seeded from code.
/// List properties (List&lt;string&gt;) map to Postgres text[] by Npgsql convention.
/// </summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Experience> Experiences => Set<Experience>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<SkillCategory> SkillCategories => Set<SkillCategory>();
    public DbSet<Skill> Skills => Set<Skill>();
    public DbSet<Certification> Certifications => Set<Certification>();
    public DbSet<Education> Education => Set<Education>();
    public DbSet<Game> Games => Set<Game>();
    public DbSet<Guide> Guides => Set<Guide>();
    public DbSet<ContactMessage> ContactMessages => Set<ContactMessage>();
    public DbSet<SiteSettings> SiteSettings => Set<SiteSettings>();
    public DbSet<KnowledgeChunk> KnowledgeChunks => Set<KnowledgeChunk>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Project>().HasIndex(p => p.Slug).IsUnique();
        modelBuilder.Entity<Game>().HasIndex(g => g.Slug).IsUnique();

        modelBuilder.Entity<Skill>()
            .HasOne(s => s.SkillCategory)
            .WithMany(c => c.Skills)
            .HasForeignKey(s => s.SkillCategoryId)
            .OnDelete(DeleteBehavior.Cascade);

        // pgvector lives in Supabase's "extensions" schema (keeps it out of public).
        modelBuilder.HasPostgresExtension("extensions", "vector");

        modelBuilder.Entity<KnowledgeChunk>(e =>
        {
            // Only Postgres (pgvector) can store vectors; the tests' in-memory database skips the column.
            if (Database.IsNpgsql())
                e.Property(k => k.Embedding).HasColumnType($"vector({KnowledgeChunk.EmbeddingDimensions})");
            else
                e.Ignore(k => k.Embedding);
            // The indexer upserts on this key.
            e.HasIndex(k => new { k.SourceType, k.SourceId, k.ChunkIndex }).IsUnique();
            // Cosine-distance search (<=>) for retrieval.
            if (Database.IsNpgsql())
                e.HasIndex(k => k.Embedding).HasMethod("hnsw").HasOperators("vector_cosine_ops");
        });

        // SiteSettings is a single row with a fixed id.
        modelBuilder.Entity<SiteSettings>().Property(s => s.Id).ValueGeneratedNever();
    }
}
