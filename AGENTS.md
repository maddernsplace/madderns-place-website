# AGENTS.md — Maddern's Place Garden & Landscaping website

This file is the onboarding brief for any AI coding agent (Codex, Claude Code,
etc.) working in this repo. Read it before making changes. There is no other
architecture doc — this is it.

## What this is

The public marketing website for **Maddern's Place Garden & Landscaping**, a
landscaping business operating out of Hackham, South Australia (servicing
Adelaide's southern suburbs). It is a lead-generation site: SEO landing pages,
a project/before-after gallery, a blog, customer reviews, and a small shop —
all driving phone calls, quote requests, and an on-site AI chat widget.

Live at **https://maddernsplace.com** (see `CNAME`).

## Tech stack — deliberately simple

- **Plain static HTML/CSS/JS.** No framework (no React/Vue/Next), no bundler,
  no build step for the pages themselves. Every page is self-contained: each
  `.html` file has its own inline `<style>` block and inline `<script>` — there
  is no shared stylesheet or shared header/footer include. If you change the
  nav/footer/header markup, you generally have to change it in every page that
  has it (there is no templating layer).
- **Hosting: GitHub Pages**, custom domain via the `CNAME` file
  (`maddernsplace.com`). Pushing HTML to the default branch (`main`) is what
  publishes the site — there is no separate deploy step or CI build.
- `package.json` only declares `sharp` as a dev dependency (used by ad-hoc
  local image-processing scripts, not by any page or build pipeline).

## Repo layout

- **Top-level `.html` files** are mostly real, full SEO landing pages (e.g.
  `landscaping-adelaide-south.html`, `retaining-walls-adelaide.html`,
  `turf-installation-adelaide-south.html`, `driveway-paving-front-yard-...html`).
  These are large (20–40KB+) and each carries its own meta tags, Open Graph /
  Twitter tags, and JSON-LD structured data.
- A few short top-level `.html` files (`mowing.html`, `garden-design.html`,
  `irrigation.html`, `landscaping.html`, `blog.html`, `shop.html`,
  `projects.html`) are **redirect stubs** (`<meta http-equiv="refresh">`) that
  point at a matching directory, e.g. `mowing.html` → `/mowing/`. The real
  content for those sections lives in `mowing/index.html`,
  `garden-design/index.html`, `irrigation/index.html`, `landscaping/index.html`,
  `blog/`, `shop/`, `projects/`. Don't be fooled by the small stub file size —
  check whether a matching directory exists before assuming a page is thin.
- Individual **project case-study pages** live at the repo root as long
  slugged filenames (e.g. `marion-backyard-lawn-irrigation-transformation.html`)
  and are large (700KB+) because photos are inlined/handled per project.
- `projects/index.html` — the projects gallery page, rendered client-side from
  `projects.json`.
- `blog/` — blog section; posts are driven by `posts.json`.
- `admin/`, plus `site-admin.html`, `projects-admin.html`, `blog-admin.html`,
  `reviews-admin.html`, `shop-admin.html`, `jobs-admin.html` — **client-side
  CMS admin panels** (password-gated in the browser, not a real auth system).
  See "Content model" below for how they publish. `jobs-admin.html` is an
  internal-only job schedule (customer, address, job type, date/time, status,
  notes) for the owner to plan work — it's not linked from or shown on the
  public site.
- Data files at repo root: `site-content.json` (homepage copy, services,
  process steps, contact info, supplier logos, chat widget config),
  `projects.json` (project gallery entries — this file is ~2.3MB, don't read
  it in full, `grep`/slice it), `posts.json` (blog posts), `reviews.json`,
  `shop.json`, `beforeafter.json`, `jobs.json` (internal job schedule, used
  only by `jobs-admin.html`).
- `chat-worker.js` — source for a **Cloudflare Worker** (deployed separately,
  not part of this repo's build) that proxies chat messages from the site's
  chat widget to the Anthropic API (`claude-haiku-4-5-20251001`). It reads the
  `ANTHROPIC_API_KEY` from a Cloudflare env var. The worker's URL is stored in
  `site-content.json` → `chat.workerUrl`. Changing the model/prompt behavior
  requires editing this file and re-deploying it to Cloudflare manually (see
  the comment block at the top of the file) — pushing to this repo does not
  redeploy it.
- Image directories: `Images/`, `LocationImages/`, `project-images/`,
  `blog-images/`, `before-after-images/`. Large uploaded photos are common.
- `.github/workflows/compress-images.yml` — on every push that touches an
  image file (`jpg/jpeg/png/webp`), this workflow re-compresses any changed
  image over 200KB (resize to max 1920px, quality 82 via ImageMagick) and
  auto-commits the result straight to `main` as "Auto-compress uploaded
  images". This is why you'll see that commit message repeatedly in history —
  it's automated, not a human/agent edit.
- `llms.txt` — an LLM-readable summary of the business (services, area,
  contact info), kept for AI answer engines / LLM crawlers. Update it if
  services or coverage area change.

## Content model — how the site actually gets edited day-to-day

The business owner (non-technical) edits content through the admin HTML pages
in a browser (`site-admin.html`, `projects-admin.html`, `blog-admin.html`,
`reviews-admin.html`, `shop-admin.html`). These pages:

1. Store a **GitHub personal access token, repo name, and branch** in the
   browser's `localStorage` (keys `mp_gh_token`, `mp_gh_repo`,
   `mp_gh_branch`, default repo `maddernsplace/madderns-place-website`,
   default branch `main`).
2. On "Publish", call the **GitHub Contents API directly from the browser**
   (`GET`/`PUT` `https://api.github.com/repos/{repo}/contents/{path}`) to read
   the current file SHA and commit an updated JSON file (and any generated
   HTML page, e.g. a new project case-study page) straight to the target
   branch. There is no server, no PR, no review step in this flow — it's a
   direct commit.
3. This is why the commit history is full of auto-generated messages like
   `Project page: <title>`, `Update projects gallery (N projects)`, `Update
   blog posts (N published)` — those come from the admin panel, not from a
   coding agent.

**Implication for agents:** the JSON data files and the generated page files
are a "database" that a non-technical user actively edits through the browser
admin, potentially at any time. When changing the *shape* of a JSON file
(e.g. adding a field to a project entry), you must also update whichever
admin page writes/reads that shape, and ideally keep it backward-compatible
with existing entries already committed.

## Working conventions for this repo

- No build/lint/test tooling is configured. Verify HTML/JS changes by opening
  the file in a browser or reasoning carefully — there's no `npm test`/`npm
  run build` to lean on.
- Match the existing style: vanilla JS, inline `<style>` per page, no
  external CSS framework, mobile-responsive hand-written CSS. Don't introduce
  a bundler, framework, or shared-component system unless explicitly asked —
  it would break the "every page is self-contained and directly editable"
  model the admin panels depend on.
- When adding a new page, follow the existing SEO pattern: canonical link,
  Open Graph + Twitter meta, JSON-LD `LandscapeService`/`LocalBusiness` or
  `Article` structured data (copy from a similar existing page), and add it to
  `sitemap.xml`.
- Don't hand-edit `projects.json`, `posts.json`, `reviews.json`, or
  `shop.json` casually — they're large, ID-keyed, timestamp-ordered arrays
  written by the admin panels. If a task requires editing them, preserve the
  existing schema exactly (see field names in `projects.json`: `id`,
  `createdAt`, `title`, `description`, `blogLink`, `visible`, `image: {name,
  path}`, `updatedAt`).
- Contact details, phone number, email, and business info are centralized in
  `site-content.json.contact` and repeated in JSON-LD blocks across pages —
  if these ever change, they need updating in multiple places (no single
  source of truth is enforced).
- Real secrets (GitHub token, Anthropic API key) are **never** stored in this
  repo — they live in the browser's `localStorage` (admin GitHub token) and
  in Cloudflare Worker environment variables (Anthropic key). Don't add
  secrets to any file here.

## Branching / git

- Default branch is `main`; GitHub Pages serves directly from it.
- Follow whatever branch/PR instructions are given in your task. Don't push
  straight to `main` unless explicitly told the workflow allows it — the
  automated image-compression workflow and the admin panel both already push
  to `main` directly, so coordinate rather than assuming you're the only
  writer.
