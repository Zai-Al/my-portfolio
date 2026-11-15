// Copyright (c) 2026 Zainab Alawi. All rights reserved.

using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace PortfolioApi.Tests;

/// <summary>
/// Saving the same record twice returns 409 with a readable message (shown in the admin
/// portal's popup); close-but-different records and edits that keep their own values still save.
/// </summary>
public class DuplicateTests : IClassFixture<TestApiFactory>
{
    private readonly TestApiFactory _factory;
    public DuplicateTests(TestApiFactory factory) => _factory = factory;

    // Every test uses its own names, because tests in this class share one in-memory database.
    private static string Unique(string label) => $"{label} {Guid.NewGuid():N}";

    private HttpClient Admin()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", TestApiFactory.Token(TestApiFactory.AdminEmail));
        return client;
    }

    private async Task<int> Create(string path, object body)
    {
        var response = await Admin().PostAsJsonAsync(path, body);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return json.RootElement.GetProperty("id").GetInt32();
    }

    private static async Task<string> AssertConflict(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var detail = json.RootElement.GetProperty("detail").GetString();
        Assert.False(string.IsNullOrWhiteSpace(detail));
        return detail!;
    }

    [Fact]
    public async Task Experience_same_company_role_and_start_date_is_refused()
    {
        var company = Unique("Acme");
        await Create("/api/experiences", new { company, role = "Intern", startDate = "Jun 2026" });

        // Different case and extra spaces still count as the same record.
        var response = await Admin().PostAsJsonAsync("/api/experiences",
            new { company = "  " + company.ToUpperInvariant() + " ", role = "intern", startDate = "jun  2026" });

        var message = await AssertConflict(response);
        Assert.Contains("Intern", message);
    }

    [Fact]
    public async Task Experience_at_the_same_company_with_another_role_or_date_is_allowed()
    {
        var company = Unique("Acme");
        await Create("/api/experiences", new { company, role = "Intern", startDate = "Jun 2026" });

        await Create("/api/experiences", new { company, role = "Engineer", startDate = "Jun 2026" });
        await Create("/api/experiences", new { company, role = "Intern", startDate = "Jan 2027" });
    }

    [Fact]
    public async Task Education_same_institution_and_degree_is_refused_another_degree_is_allowed()
    {
        var institution = Unique("Poly");
        await Create("/api/education", new { institution, degree = "BSc ICT" });

        await AssertConflict(await Admin().PostAsJsonAsync("/api/education", new { institution, degree = "bsc ict" }));
        await Create("/api/education", new { institution, degree = "MSc Computing" });
    }

    [Fact]
    public async Task Certification_same_credential_id_is_refused()
    {
        var credentialId = Unique("ID");
        await Create("/api/certifications", new { name = Unique("Java"), issuer = "Oracle", credentialId });

        var response = await Admin().PostAsJsonAsync("/api/certifications",
            new { name = Unique("Other"), issuer = "Other", credentialId });

        Assert.Contains("Credential ID", await AssertConflict(response));
    }

    [Fact]
    public async Task Certification_same_name_issuer_and_date_is_refused_a_renewal_is_allowed()
    {
        var name = Unique("Power Platform");
        await Create("/api/certifications", new { name, issuer = "Microsoft", issueDate = "Jul 2024" });

        await AssertConflict(await Admin().PostAsJsonAsync("/api/certifications",
            new { name, issuer = "microsoft", issueDate = "Jul 2024" }));
        await Create("/api/certifications", new { name, issuer = "Microsoft", issueDate = "Jul 2026" });
    }

    [Fact]
    public async Task Skill_is_unique_within_its_category_only()
    {
        var first = await Create("/api/skill-categories", new { name = Unique("Languages") });
        var second = await Create("/api/skill-categories", new { name = Unique("Tools") });
        var name = Unique("Docker");
        await Create("/api/skills", new { name, skillCategoryId = first });

        await AssertConflict(await Admin().PostAsJsonAsync("/api/skills", new { name, skillCategoryId = first }));
        await Create("/api/skills", new { name, skillCategoryId = second });
    }

    [Fact]
    public async Task Skill_category_same_name_is_refused()
    {
        var name = Unique("Databases");
        await Create("/api/skill-categories", new { name });

        await AssertConflict(await Admin().PostAsJsonAsync("/api/skill-categories", new { name }));
    }

    [Fact]
    public async Task Project_same_slug_or_same_title_is_refused()
    {
        var title = Unique("Portfolio");
        var slug = Guid.NewGuid().ToString("N");
        await Create("/api/projects", new { title, slug, summary = "s", description = "d" });

        var sameSlug = await AssertConflict(await Admin().PostAsJsonAsync("/api/projects",
            new { title = Unique("Other"), slug, summary = "s", description = "d" }));
        Assert.Contains("slug", sameSlug);
        await AssertConflict(await Admin().PostAsJsonAsync("/api/projects",
            new { title, slug = Guid.NewGuid().ToString("N"), summary = "s", description = "d" }));
    }

    [Fact]
    public async Task Guide_same_question_is_refused()
    {
        var title = Unique("Who is Zainab?");
        await Create("/api/guides", new { title, answer = "a" });

        await AssertConflict(await Admin().PostAsJsonAsync("/api/guides", new { title, answer = "b" }));
    }

    [Fact]
    public async Task Editing_a_record_never_clashes_with_itself()
    {
        var title = Unique("Where is your CV?");
        var id = await Create("/api/guides", new { title, answer = "old" });

        var response = await Admin().PutAsJsonAsync($"/api/guides/{id}", new { title, answer = "new" });

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task Editing_a_record_into_a_copy_of_another_is_refused()
    {
        var taken = Unique("Taken question");
        await Create("/api/guides", new { title = taken, answer = "a" });
        var id = await Create("/api/guides", new { title = Unique("Free question"), answer = "b" });

        var response = await Admin().PutAsJsonAsync($"/api/guides/{id}", new { title = taken, answer = "b" });

        await AssertConflict(response);
    }
}
