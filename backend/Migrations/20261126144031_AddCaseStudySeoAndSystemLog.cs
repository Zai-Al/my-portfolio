using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace PortfolioApi.Migrations
{
    /// <inheritdoc />
    public partial class AddCaseStudySeoAndSystemLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SeoDescription",
                table: "SiteSettings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SeoDescriptionAr",
                table: "SiteSettings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Challenge",
                table: "Projects",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ChallengeAr",
                table: "Projects",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Learned",
                table: "Projects",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LearnedAr",
                table: "Projects",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ShowDemo",
                table: "Projects",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "ShowRepo",
                table: "Projects",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "SystemLog",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Fingerprint = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Level = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    Source = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Message = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ExceptionType = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    StackTrace = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    Count = table.Column<int>(type: "integer", nullable: false),
                    FirstSeen = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastSeen = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Resolved = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SystemLog", x => x.Id);
                });

            // Deny-all RLS, like every other table: no policies, so the Supabase anon/authenticated
            // keys can't read or write it. The API connects as the table owner and is unaffected.
            migrationBuilder.Sql("ALTER TABLE \"SystemLog\" ENABLE ROW LEVEL SECURITY;");

            migrationBuilder.CreateIndex(
                name: "IX_SystemLog_Fingerprint",
                table: "SystemLog",
                column: "Fingerprint",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SystemLog_LastSeen",
                table: "SystemLog",
                column: "LastSeen");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SystemLog");

            migrationBuilder.DropColumn(
                name: "SeoDescription",
                table: "SiteSettings");

            migrationBuilder.DropColumn(
                name: "SeoDescriptionAr",
                table: "SiteSettings");

            migrationBuilder.DropColumn(
                name: "Challenge",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "ChallengeAr",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "Learned",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "LearnedAr",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "ShowDemo",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "ShowRepo",
                table: "Projects");
        }
    }
}
