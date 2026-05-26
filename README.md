# Concordia Bible Institute — Study Guide Platform

A premium SaaS learning platform for the **Christ in Every Word** podcast:
319 downloadable Bible study guides across 22 books of Scripture, with podcast
episodes, subscriptions, a shopping cart, a member dashboard, and an admin
console.

Built with **Next.js 14 (App Router)**, **Tailwind CSS**, and **Framer Motion**.

---

## Quick start

```bash
npm install
npm run catalog   # (one-time) build catalog.json from /downloads/Formatted
npm run dev       # http://localhost:3000
```

Once Supabase is set up (see below), every admin edit lands directly in the
database — no rebuild required.

Production build:

```bash
npm run build && npm start
```

---

## Supabase setup (auth + database + storage)

The app reads all content (podcasts, episodes, study-guide URLs) from Supabase
and authenticates the admin via Supabase Auth. You'll set this up once, then
manage everything from `/admin`.

### 1. Create the project

1. Go to <https://supabase.com>, create a new project. Note the **Project URL**
   and the **anon** and **service_role** keys (Project Settings → API).
2. Copy `.env.local.example` → `.env.local` and paste those three values into:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` *(server only — never expose in the browser)*

### 2. Create the schema

In Supabase **SQL Editor**, paste and run the contents of `supabase/schema.sql`.
This creates the `profiles`, `podcasts`, `episodes`, `user_downloads`,
`user_bookmarks` tables, the `study-guides` storage bucket, the auth trigger
that auto-creates a profile row on signup, and all RLS policies (public can
read published rows; only admins can write).

### 3. Seed the catalog

```bash
npm run seed
```

This reads `data/catalog.json` (built earlier by `npm run catalog` from your
`FeaturedPdfs` folder) and upserts the 22 series + 319 episodes into Supabase.
Idempotent — safe to re-run.

### 4. Create your admin account

1. Run `npm run dev` and sign up at <http://localhost:3000/signup> with the
   email you want as admin.
2. In Supabase **SQL Editor**, promote yourself:

   ```sql
   update public.profiles set role = 'admin' where email = 'YOU@example.com';
   ```

3. Log out and back in at `/login`. The Admin Console appears at `/admin`.

### 5. (Optional) Upload PDFs through the admin UI

Going forward you don't need the `FeaturedPdfs` folder. In `/admin/episodes`,
click **Upload** next to any episode — the PDF goes straight to the
`study-guides` Supabase Storage bucket and its public URL gets written to the
episode row. Replacing a PDF overwrites the same path.

---

## What's included

| Area | Pages |
|------|-------|
| Marketing | Home, About, FAQ, Pricing, Terms, Privacy |
| Library | All podcasts (`/podcasts`), series detail, episode detail |
| Discovery | Live search (`/search`) + hero search with dropdown |
| Commerce | Cart & multi-item checkout (`/cart`) |
| Accounts | Login, Signup, Member dashboard |
| Admin | Overview analytics, Content, Users, Email, Settings |
| SEO/robust | `sitemap.xml`, `robots.txt`, error boundary, 404 |

**Design** — maroon (`#8B1538`) / white / gold (`#D4AF37`), serif display type,
3D tilt cards, staggered hero reveal, scroll animations, animated counters,
toast notifications.

---

## Content

`scripts/build-catalog.mjs` scans `/Users/sarithachalluri/downloads/Formatted`,
pairs each `.docx` study guide with its YouTube URL and transcript, writes
`data/catalog.json`, and copies the guides into `public/guides/`. Rerun it with
`npm run catalog` whenever the source folder changes.

> Study guides are served as `.docx` (the source format). To serve PDFs, add a
> LibreOffice/`docx→pdf` conversion step to the catalog script.

---

## Going to production (mock → real)

Auth + content + storage now run on **Supabase** (see setup above). Remaining
integrations to wire when you're ready:

1. **Stripe** — add Checkout sessions in `components/PricingPlans.jsx` and
   `app/cart/page.jsx`; add a webhook route to confirm subscriptions.
2. **Resend** — wire `components/Newsletter.jsx` and the admin Email tab to the
   Resend API; send the transactional emails listed in the admin console.

After admin uploads are flowing, `public/guides/` and `scripts/build-catalog.mjs`
become optional — keep them only if you still want a way to bulk-import from a
local folder. You can delete `data/catalog.json` once the database is the source
of truth.

---

## Project structure

```
app/                  Routes (App Router) — pages, sitemap, robots, error, 404
  api/search/         Public search endpoint backed by Supabase
  admin/              CRUD console for podcasts, episodes, users, settings
components/           UI: Header, Footer, Hero, cards, forms, admin widgets
context/              Auth (Supabase), Cart, Toast providers
lib/
  catalog.js          Async server-side data fns (Supabase queries)
  catalog-shared.js   SITE / TESTAMENTS / STATS constants — client+server safe
  supabase/
    client.js         Browser client (anon key, used in client components)
    server.js         Server client w/ cookies (user-session-aware)
    public.js         Anonymous server client (no cookies, for SSR/sitemap)
    admin.js          Service-role client (server only, bypasses RLS)
supabase/schema.sql   Tables, RLS policies, storage bucket, auth trigger
scripts/
  build-catalog.mjs   Build catalog.json from /downloads/Formatted
  seed-supabase.mjs   Upsert catalog.json into Supabase
data/catalog.json     One-time seed source (DB becomes source of truth after)
```
