// Copyright (c) 2026 Zainab Alawi. All rights reserved.

// A stand-in for the ASP.NET API, for the Playwright smoke tests: serves fixed, obviously
// fake content so the tests never touch the real database (or Gemini). Started by
// playwright.config.ts; the site is built against it (NEXT_PUBLIC_API_URL).

import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_API_PORT ?? 5099);

const settings = {
  id: 1,
  fullName: "Test Person",
  headline: "Software Engineer | Test Data",
  bio: "I am sample content used only by the automated tests. Nothing here is real.",
  location: "Testland",
  availability: "Available for tests",
  phone: null,
  email: null,
  linkedInUrl: "https://www.linkedin.com/in/example",
  githubUrl: "https://github.com/example",
  cvUrl: null,
  profileImageUrl: null,
  heroQuote: "Tests first.",
  softSkills: ["Testing"],
  spokenLanguages: ["English"],
  seoDescription: "Test Person builds sample apps for automated tests.",
  fullNameAr: "شخص تجريبي",
  headlineAr: null,
  bioAr: "محتوى تجريبي للاختبارات فقط.",
  locationAr: null,
  availabilityAr: null,
  heroQuoteAr: null,
  softSkillsAr: [],
  spokenLanguagesAr: [],
  seoDescriptionAr: null,
  hasEmail: false,
};

const project = (id, slug, title, year, extra = {}) => ({
  id,
  title,
  slug,
  summary: `${title} is a sample project.`,
  description: `A longer description of ${title}.`,
  context: "Sample context",
  myRole: "Built the sample.",
  highlights: ["First highlight"],
  tech: ["TypeScript"],
  screenshots: [],
  icon: "FaProjectDiagram",
  repoUrl: null,
  demoUrl: null,
  demoNotes: null,
  year,
  featured: id === 1,
  sortOrder: id,
  titleAr: null,
  summaryAr: null,
  descriptionAr: null,
  contextAr: null,
  myRoleAr: null,
  highlightsAr: [],
  demoNotesAr: null,
  showRepo: false,
  showDemo: false,
  challenge: null,
  learned: null,
  challengeAr: null,
  learnedAr: null,
  ...extra,
});

const routes = {
  "/api/site-settings": settings,
  "/api/projects": [
    // Repo button on, and a case study.
    project(1, "sample-shop", "Sample Shop", "2025", {
      repoUrl: "https://github.com/example/sample-shop",
      showRepo: true,
      challenge: "Checkout kept timing out.",
      learned: "Measure before optimising.",
    }),
    // A repo URL without "show": the button must stay hidden.
    project(2, "demo-tracker", "Demo Tracker", "2024", {
      repoUrl: "https://github.com/example/private",
    }),
  ],
  // Free-text dates, as in the real database ("Jun 2024", "Present").
  "/api/experiences": [
    {
      id: 1,
      company: "Example Co",
      role: "Test Engineer",
      department: null,
      location: "Testland",
      startDate: "Jun 2024",
      endDate: "Present",
      summary: "Wrote sample data.",
      bullets: ["Did a thing"],
      tech: ["Playwright"],
      icon: "FaBriefcase",
      proofImageUrl: null,
      sortOrder: 1,
      companyAr: null,
      roleAr: null,
      departmentAr: null,
      locationAr: null,
      summaryAr: null,
      bulletsAr: [],
    },
  ],
  "/api/education": [
    {
      id: 1,
      institution: "Sample University",
      degree: "BSc Testing",
      location: null,
      startDate: "September 2020",
      endDate: "Jun 2024",
      awards: ["Sample Award"],
      icon: "FaGraduationCap",
      sortOrder: 1,
      institutionAr: null,
      degreeAr: null,
      locationAr: null,
      awardsAr: [],
    },
  ],
  "/api/certifications": [
    {
      id: 1,
      name: "Certified Tester",
      issuer: "Example Board",
      issueDate: "Mar 2025",
      expiryDate: null,
      credentialId: null,
      credentialUrl: null,
      imageUrl: null,
      icon: "FaCertificate",
      sortOrder: 1,
      nameAr: null,
      issuerAr: null,
    },
  ],
  "/api/skill-categories": [
    {
      id: 1,
      name: "Testing",
      icon: "FaVial",
      sortOrder: 1,
      nameAr: null,
      skills: [
        {
          id: 1,
          name: "Playwright",
          skillCategoryId: 1,
          icon: "FaVial",
          includes: [],
          sortOrder: 1,
          nameAr: null,
          includesAr: [],
        },
      ],
    },
  ],
  "/api/guides": [
    {
      id: 1,
      title: "What is this site?",
      answer: "A sample.",
      keywords: [],
      sortOrder: 1,
      titleAr: null,
    },
  ],
};

createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
  if (req.method === "OPTIONS") return res.writeHead(204).end();

  const path = new URL(req.url ?? "/", "http://localhost").pathname;
  if (path === "/health") return res.writeHead(200).end("ok");

  // The AI guide streams Server-Sent Events; answer with one short, fixed reply.
  if (req.method === "POST" && path === "/api/ask") {
    res.writeHead(200, { "Content-Type": "text/event-stream" });
    res.write(`data: ${JSON.stringify({ type: "delta", text: "Sample answer." })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: "sources", sources: [] })}\n\n`);
    return res.end();
  }

  if (req.method === "GET" && path in routes) {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(routes[path]));
  }
  res.writeHead(404).end();
}).listen(PORT, () => console.log(`mock API on http://localhost:${PORT}`));
