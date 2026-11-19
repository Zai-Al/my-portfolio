using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortfolioApi.Migrations
{
    /// <inheritdoc />
    public partial class AddArabicContent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<List<string>>(
                name: "IncludesAr",
                table: "Skills",
                type: "text[]",
                nullable: false,
                defaultValueSql: "'{}'");

            migrationBuilder.AddColumn<string>(
                name: "NameAr",
                table: "Skills",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NameAr",
                table: "SkillCategories",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AvailabilityAr",
                table: "SiteSettings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BioAr",
                table: "SiteSettings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FullNameAr",
                table: "SiteSettings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HeadlineAr",
                table: "SiteSettings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HeroQuoteAr",
                table: "SiteSettings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LocationAr",
                table: "SiteSettings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<List<string>>(
                name: "SoftSkillsAr",
                table: "SiteSettings",
                type: "text[]",
                nullable: false,
                defaultValueSql: "'{}'");

            migrationBuilder.AddColumn<List<string>>(
                name: "SpokenLanguagesAr",
                table: "SiteSettings",
                type: "text[]",
                nullable: false,
                defaultValueSql: "'{}'");

            migrationBuilder.AddColumn<string>(
                name: "ContextAr",
                table: "Projects",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DemoNotesAr",
                table: "Projects",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DescriptionAr",
                table: "Projects",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<List<string>>(
                name: "HighlightsAr",
                table: "Projects",
                type: "text[]",
                nullable: false,
                defaultValueSql: "'{}'");

            migrationBuilder.AddColumn<string>(
                name: "MyRoleAr",
                table: "Projects",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SummaryAr",
                table: "Projects",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TitleAr",
                table: "Projects",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TitleAr",
                table: "Guides",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<List<string>>(
                name: "BulletsAr",
                table: "Experiences",
                type: "text[]",
                nullable: false,
                defaultValueSql: "'{}'");

            migrationBuilder.AddColumn<string>(
                name: "CompanyAr",
                table: "Experiences",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DepartmentAr",
                table: "Experiences",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LocationAr",
                table: "Experiences",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RoleAr",
                table: "Experiences",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SummaryAr",
                table: "Experiences",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<List<string>>(
                name: "AwardsAr",
                table: "Education",
                type: "text[]",
                nullable: false,
                defaultValueSql: "'{}'");

            migrationBuilder.AddColumn<string>(
                name: "DegreeAr",
                table: "Education",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InstitutionAr",
                table: "Education",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LocationAr",
                table: "Education",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IssuerAr",
                table: "Certifications",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NameAr",
                table: "Certifications",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IncludesAr",
                table: "Skills");

            migrationBuilder.DropColumn(
                name: "NameAr",
                table: "Skills");

            migrationBuilder.DropColumn(
                name: "NameAr",
                table: "SkillCategories");

            migrationBuilder.DropColumn(
                name: "AvailabilityAr",
                table: "SiteSettings");

            migrationBuilder.DropColumn(
                name: "BioAr",
                table: "SiteSettings");

            migrationBuilder.DropColumn(
                name: "FullNameAr",
                table: "SiteSettings");

            migrationBuilder.DropColumn(
                name: "HeadlineAr",
                table: "SiteSettings");

            migrationBuilder.DropColumn(
                name: "HeroQuoteAr",
                table: "SiteSettings");

            migrationBuilder.DropColumn(
                name: "LocationAr",
                table: "SiteSettings");

            migrationBuilder.DropColumn(
                name: "SoftSkillsAr",
                table: "SiteSettings");

            migrationBuilder.DropColumn(
                name: "SpokenLanguagesAr",
                table: "SiteSettings");

            migrationBuilder.DropColumn(
                name: "ContextAr",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "DemoNotesAr",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "DescriptionAr",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "HighlightsAr",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "MyRoleAr",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "SummaryAr",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "TitleAr",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "TitleAr",
                table: "Guides");

            migrationBuilder.DropColumn(
                name: "BulletsAr",
                table: "Experiences");

            migrationBuilder.DropColumn(
                name: "CompanyAr",
                table: "Experiences");

            migrationBuilder.DropColumn(
                name: "DepartmentAr",
                table: "Experiences");

            migrationBuilder.DropColumn(
                name: "LocationAr",
                table: "Experiences");

            migrationBuilder.DropColumn(
                name: "RoleAr",
                table: "Experiences");

            migrationBuilder.DropColumn(
                name: "SummaryAr",
                table: "Experiences");

            migrationBuilder.DropColumn(
                name: "AwardsAr",
                table: "Education");

            migrationBuilder.DropColumn(
                name: "DegreeAr",
                table: "Education");

            migrationBuilder.DropColumn(
                name: "InstitutionAr",
                table: "Education");

            migrationBuilder.DropColumn(
                name: "LocationAr",
                table: "Education");

            migrationBuilder.DropColumn(
                name: "IssuerAr",
                table: "Certifications");

            migrationBuilder.DropColumn(
                name: "NameAr",
                table: "Certifications");
        }
    }
}
