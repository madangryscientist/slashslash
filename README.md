# slashslash

The source of **[slashslash.build](https://slashslash.build)**, the public site for the Slash tools
(ToggleSlash, BundleSlash, FlakeSlash and PixelSlash).

Two pages, built to static HTML with [Astro](https://astro.build):

- `/` is written for a CEO, COO or CFO: "See what a change really does, before your customers do." It
  explains, with no code on screen, how a change reaches customers today, what nobody checks, what that
  costs and what slashslash adds, then asks four questions.
- `/developers` holds the developer detail: the seven stops of one feature, environment variables, the
  effect of one flag, the four tools with their status labels, how to run PixelSlash today, and its own
  questions.

Both are read by scrolling, with nothing to click. No database, accounts, form or cookie.

## Layout

A [Bun workspaces](https://bun.sh/docs/install/workspaces) monorepo run with [moon](https://moonrepo.dev):

- `apps/site`: the site (moon project `site`).
- `scripts`: repo checks, such as `scripts/check-slop.ts` (moon project `scripts`).
- `packages/`: shared packages, none yet.
- `self-host`: the one self-host image and the Proxmox install script (moon project `self-host`).
- `skills/`: guides for coding agents, such as `skills/self-host` for running your own instance.

`.moon/workspace.yml` lists the projects, each project's `moon.yml` holds its tasks, and
`.moon/tasks/all.yml` the root files every task depends on. moon caches each task in `.moon/cache`, so an
unchanged task is a cache hit. From here on, a path such as `src/content/site.ts` is under `apps/site/`.

## Develop

Needs [Bun](https://bun.sh).

```bash
bun install
bun run dev                     # the site's dev server, http://localhost:4321
bunx moon run site:build        # static output in apps/site/dist/
cd apps/site && bun run preview # serve apps/site/dist/
```

The `/pixelslash` pages are built from PixelSlash files fetched at the commit in `apps/site/pixelslash.sha`.
`.github/workflows/pixelslash-pin.yml` moves that pin: every hour, when a fetched file has changed on PixelSlash
main, it opens a pull request that moves the pin, gates it, merges it when green and starts the deploy. Run it
by hand with `gh workflow run pixelslash-pin.yml`.

## Check

```bash
bun run lint       # site:lint (oxlint) and scripts:lint (scripts/check-slop.ts)
bun run typecheck  # site:typecheck (astro check) and scripts:typecheck (tsc)
bun run build      # site:build
bun run test       # site:test, which builds first
```

Each runs `moon run --concurrency 3 :<task>` across the projects; CI runs all four in one
`bunx moon run --concurrency 3 :lint :typecheck :build :test`.

The tests read `apps/site/dist/` and check the agreed copy and its order, that every product shows its status label,
that made-up material says so, that no privacy claim and no forbidden word is present, that nothing is hidden
or in a start state without motion, that the colour pairs pass AA contrast in both themes, and that the site
is open to search engines (`robots.txt`, `sitemap.xml`, a canonical address per page, no robots meta tag).

## How the page is built

Astro renders every section to HTML at build time (`src/pages/`, `src/layouts/Base.astro`). The sections are
React components in `src/components/`, one file per section, with the words in `src/content/`. Only four
things run in the browser, as Astro islands:

- the light/dark toggle (`client:load`),
- the motion script (`src/components/motion.tsx`, `client:load`), which plays each drawing once as it scrolls
  into view,
- the report dialog on `/` (inside `stands.tsx`, `client:visible`),
- the copy buttons and the count-up on `/developers` (`today.tsx` and `flags.tsx`, `client:visible`).

`Base.astro` carries an inline script that runs before first paint: it applies the stored or system colour
scheme (so there is no flash) and adds the `motion` class when the reader allows motion. If the motion
script has not started within 3 seconds, it takes `motion` off again, so no start state can hide the copy.

**Motion only decorates.** Everything is SVG and CSS. The base style of every element is its finished state;
start states sit under `.motion ...:not(.played)`, and every animation is inside
`@media (prefers-reduced-motion: no-preference)`. A test refuses one outside it.

**Real and imagined look different.** `Frame` in `src/components/evidence.tsx` draws four kinds: `real`
(captured by running the tool), `quoted` (printed in the tool's docs), `made-up` and `idea` (dashed and
hatched, labelled where they appear). Never give something unbuilt a `real` frame; a test refuses it.

## Things to change in one place

- `src/content/site.ts`: the name, the address (`SITE_URL`, which makes the share image's URL absolute) and
  the contact line. Never put an email address or a phone number there.
- `src/content/products.ts`: the four products and their status labels. `src/content/flow.ts`: the seven stops.
- `TOGGLESLASH_REPO_URL` in `src/content/site.ts` is empty while that repository is private; set it and a
  link replaces the words "Not public yet".

## Design system

Status pills, copy lines, links and the theme toggle come from `@hackcove/ui-react`, on `@hackcove/themes`.
Everything else is plain CSS in `src/styles.css` with per-theme tokens, because the pipeline, the hero panes
and the other drawings are one-off.

Fonts are self-hosted and subset (`apps/site/public/fonts/`, licences beside them): Bricolage Grotesque for text,
JetBrains Mono for code. The mono subset holds ASCII plus nbsp and the middle dot, so code on the page must
stay within those; a missing glyph means re-subsetting.

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`: it checks and builds on a GitHub-hosted runner, then a
second job, the only one that holds the Cloudflare token (in the `production` environment), uploads
`apps/site/dist/` to Cloudflare Pages with `wrangler pages deploy`. Pull requests run only `ci.yml`, which gets
the moon cache read token and nothing else; the Cloudflare token stays with the deploy job.

Every page names the commit it was built from in a hidden `<meta name="build-commit">` in its head. To see
which commit is live:

```sh
curl -s https://slashslash.build/ | grep build-commit
```

The workflow passes its commit to the build as `BUILD_COMMIT`, and after the upload its `smoke` job checks
that the live home page names that commit, retrying for up to two minutes while the edge catches up. A
local build without `BUILD_COMMIT` reads `git rev-parse HEAD` (with `-dirty` on a dirty tree), and a moon
cache hit there can carry an older commit; only CI deploys, so that never reaches the live site.

## Shared build cache

moon reads a shared remote cache when `MOON_REMOTE_TOKEN` holds a read token: `export MOON_REMOTE_TOKEN=<read
token>` before `bunx moon run`. Without it moon logs a warning about the remote and uses the local cache only.
Only a push to `main` writes to the shared cache.

## Licence

Code: MIT, see [LICENSE](LICENSE). The copy, images, logos and product names are not licensed for reuse; see
[NOTICE](NOTICE).
