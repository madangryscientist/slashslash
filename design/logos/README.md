# Logos

The suite's logo drafts, generated from code so every mark can be rebuilt. The site ships **Direction C, glyph and cut**:
its seven marks and fourteen lockups are written to `apps/site/public/brand/` and committed there.

## Regenerate

From the repo root:

```sh
uvx --with brotli==1.2.1 --with uharfbuzz==0.57.0 --from fonttools==4.68.0 python design/logos/src/gen.py
```

The versions are pinned so the outlines come out the same on every machine. Re-running the command leaves
`apps/site/public/brand/` unchanged: `git status --porcelain apps/site/public/brand` is empty after a run that matches
what is committed. If it is not empty, the generator changed on purpose, so commit the new files with it.

The share cards take two more steps, in this order: the first writes the marks, the lockups and the cards' SVGs, the
second turns each card into its PNG.

```sh
bun design/logos/src/og-pages.ts | uvx --with brotli==1.2.1 --with uharfbuzz==0.57.0 --from fonttools==4.68.0 python design/logos/src/gen.py --og -
bun design/logos/src/og-png.ts
```

After both, `git status --porcelain apps/site/public/og apps/site/public/brand` is empty when nothing changed. Run
them whenever a page is added to `PAGES` or a headline in `og.ts` changes: a card's headline wraps at three lines,
and one that will not fit is set smaller (the run says which), never cut.

## What it writes

- `apps/site/public/brand/<slug>-mark.svg` and `<slug>-lockup-{light,dark}.svg` for the seven Direction C tools
  (slash, pixelslash, flakeslash, toggleslash, bundleslash, taskslash, sightslash). Tracked in git.
- `apps/site/public/og/<slug>.svg` and `<slug>.png`: one 1200x630 share card per page, from the list in
  `apps/site/src/content/og.ts`. Tracked in git; the layout's head names the PNG.
- `design/logos/out/` (gitignored): all three directions (`a-cut`, `b-pixel`, `c-glyph`) and the review boards in
  `boards/`. Look at these before you change a mark.

## Files

- `src/gen.py`: the marks, the lockups, the boards and the colours (`THEME`, `ACCENT`). Each accent has a `light` fill
  (the deep fill, for marks on light), a `text` tone (for links, labels and the wordmark letters on light), and a `dark`
  pastel (for marks and letters on dark).
- `src/outline.py`: turns a line of text into path data from the site's own fonts in `apps/site/public/fonts/` (and
  Bricolage Grotesque from `design/logos/fonts/` for the retired direction A boards), so the text is outlines and needs no font.
- `src/og-pages.ts`: prints the share card list from `og.ts` as JSON, for `gen.py --og -`.
- `src/og-png.ts`: rasterises the card SVGs with `@resvg/resvg-js`.

These are design tools. Nothing in the site build runs them.
