# Frontend — Next.js

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS · Framer Motion. Hosted on Vercel.

## Run locally

```bash
cd frontend
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev                  # http://localhost:3000
```

| Variable                        | Value                                                                                               |
| ------------------------------- | --------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`           | Backend URL (`http://localhost:5080` locally)                                                       |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL                                                                                |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public (anon) key. Safe in the browser because every table has deny-all row-level security |

Other scripts: `npm run lint`, `npm run format` / `format:check`, `npm run build`.

## Pages

- `/`: home page. Hero with an interactive terminal, about, education, experience, certifications, skills, projects and contact. All content comes from the API.
- `/playground`: four small games (Game of Life, Debug the Bug, Compile Race, Segfault Snake).
- `/admin`: private content dashboard (not linked, `noindex`). Password plus authenticator-app sign-in through Supabase Auth.

## Structure

| Path                   | What's in it                                                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `app/`                 | Routes, metadata, Open Graph image, sitemap, robots, and `api/revalidate` (refreshes the cache after an admin save)    |
| `app/admin/`           | Dashboard split into `_components/`, `_hooks/` and `_lib/` (form config, field types, sign-in and two-factor screens)  |
| `components/sections/` | Home page sections, including `Terminal.tsx`                                                                           |
| `components/chat/`     | `ChatWidget.tsx`: the AI guide panel (streams answers, shows source links)                                             |
| `components/layout/`   | Aurora background, cursor glow, sidebar, footer, analytics                                                             |
| `components/ui/`       | Modal, lightbox, confirm dialog, `DynamicIcon` (maps icon names stored in the database to react-icons)                 |
| `components/games/`    | Playground games                                                                                                       |
| `lib/api/`             | `http.ts` (fetch wrapper), `public.ts` (cached server reads), `visitor.ts`, `ask.ts` (streamed AI answers), `admin.ts` |
| `lib/`                 | Shared types, Supabase client and storage uploads, hooks (focus trap, slow-request hint)                               |

## Notes

- **Caching:** public reads are cached for an hour under the tag `content`; the admin page calls `/api/revalidate` after each save so changes show immediately. If the API is unreachable, the page renders on demand rather than caching an empty page.
- **Security headers** are set in `next.config.js`: a Content Security Policy, HSTS, `frame-ancestors 'none'`, Referrer-Policy and Permissions-Policy. A new outside service (images, scripts, APIs) has to be added to the CSP there.
- **Motion:** every animation respects `prefers-reduced-motion`.
- **Images** (projects, certificates, CV, profile photo) are stored in Supabase Storage, not in this repo.

## Deploy (Vercel)

Import the repo with **Root Directory** `frontend` and set the three `NEXT_PUBLIC_*` variables in the Vercel project settings.
