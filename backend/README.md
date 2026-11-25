# Backend — ASP.NET Core Web API

.NET 10 · EF Core 10 · PostgreSQL (Supabase) + pgvector · Google Gemini. Runs on Render as a Docker web service.

## Run locally

Needs the [.NET 10 SDK](https://dotnet.microsoft.com/download), the EF Core CLI (`dotnet tool install --global dotnet-ef`) and a PostgreSQL database with the `vector` extension. A free [Supabase](https://supabase.com) project works.

Settings that hold secrets go in `dotnet user-secrets`, never in `appsettings.json`:

```bash
cd backend
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "<Postgres connection string>"
dotnet user-secrets set "Supabase:Url"        "<Supabase project URL>"
dotnet user-secrets set "Supabase:AdminEmail" "<email of the one admin user>"
dotnet user-secrets set "Gemini:ApiKey"       "<Google AI Studio API key>"
dotnet ef database update
dotnet run
```

The database starts empty: there is no seed data. Add content through the frontend's `/admin` page.

Tests live outside this folder (so they stay out of the Docker image):

```bash
dotnet test ../tests/PortfolioApi.Tests
```

Most tests use an in-memory database. The ones in `tests/PortfolioApi.Tests/Postgres/` (migrations, vector search, database rules) start a throwaway Postgres + pgvector container with Testcontainers, so they need Docker Desktop running. Without Docker they're skipped on your machine (the run says why); in CI they always run.

## Structure

| Folder | What's in it |
|---|---|
| `Controllers/` | `OrderedCrudController<T>` (public list/get, admin create/update/reorder/delete) and one small subclass per content type; `ContactController`, `AskController` (AI guide), `KnowledgeController` |
| `Data/` | `AppDbContext` (text[] columns, unique slugs, pgvector column) |
| `Models/` | Entity classes |
| `Migrations/` | EF Core migrations (`AddKnowledgeChunks` also turns on row-level security) |
| `Services/Gemini/` | Typed `HttpClient` for embeddings and streamed answers |
| `Services/Knowledge/` | RAG: chunking, the background indexer (`Channel<T>` queue + `BackgroundService`), retrieval, the system prompt, and an EF `SaveChangesInterceptor` that queues a re-index after content saves |
| `Health/` | Database check behind `GET /health` |

## Auth

The API has no passwords and no token signing of its own. The single admin user signs in with Supabase Auth on the frontend, and the frontend sends the access token as `Authorization: Bearer <token>`. The `AdminOnly` policy accepts the token only when:

1. it was issued by this Supabase project (`Supabase:Url`),
2. its `email` claim is `Supabase:AdminEmail`, and
3. its `aal` claim is `aal2`, meaning the authenticator-app code was verified as well as the password.

Turn off public sign-ups in Supabase as well.

## Endpoints

Content types: `experiences`, `education`, `certifications`, `skill-categories`, `skills`, `projects`, `guides`.

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/{type}`, `/api/{type}/{id}` | public | Read content, ordered by `SortOrder` |
| POST, PUT, DELETE | `/api/{type}`, `/api/{type}/{id}` | admin | Create, update, delete |
| PUT | `/api/{type}/order` | admin | Save a new order (list of ids) |
| GET / PUT | `/api/site-settings` | public / admin | Profile, bio and links |
| POST | `/api/contact` | public, rate-limited | Contact form |
| GET, PATCH, DELETE | `/api/contact`, `/api/contact/{id}` | admin | Inbox |
| POST | `/api/ask` | public, rate-limited | AI guide; answer streamed as Server-Sent Events |
| POST | `/api/knowledge/reindex` | admin | Queue a full AI knowledge rebuild |
| GET | `/api/knowledge/status` | admin | Rebuild state and chunk counts |
| GET | `/health` | public | API and database health |

## Deploy (Render)

A Docker web service built from `backend/Dockerfile` (Root Directory, Dockerfile Path and Build Context all relative to the repo root: `backend`, `backend/Dockerfile`, `backend`). Set these environment variables in Render:

- `ASPNETCORE_ENVIRONMENT=Production`
- `ConnectionStrings__DefaultConnection`
- `Supabase__Url`, `Supabase__AdminEmail`
- `Gemini__ApiKey`
- `FrontendOrigin` (the frontend URL, for CORS)

Schema changes are applied with `dotnet ef database update` against the production connection string. The free tier sleeps when idle, so the first request after a while takes up to a minute.
