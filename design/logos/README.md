# Logos

The suite's logo drafts, generated from code so every mark can be rebuilt. The site ships **Direction C, glyph and cut**:
its six marks and twelve lockups are written to `apps/site/public/brand/` and committed there.

## Regenerate

From the repo root:

```sh
uvx --with brotli==1.2.1 --with uharfbuzz==0.57.0 --from fonttools==4.68.0 python design/logos/src/gen.py
```

The versions are pinned so the outlines come out the same on every machine. Re-running the command leaves
`apps/site/public/brand/` unchanged: `git status --porcelain apps/site/public/brand` is empty after a run that matches
what is committed. If it is not empty, the generator changed on purpose, so commit the new files with it.

## What it writes

- `apps/site/public/brand/<slug>-mark.svg` and `<slug>-lockup-{light,dark}.svg` for the six Direction C tools
  (slash, pixelslash, flakeslash, toggleslash, bundleslash, taskslash). Tracked in git.
- `design/logos/out/` (gitignored): all three directions (`a-cut`, `b-pixel`, `c-glyph`), the review boards in
  `boards/`, and the OG image drafts. Look at these before you change a mark.

## Files

- `src/gen.py`: the marks, the lockups, the boards and the colours (`THEME`, `ACCENT`). Each accent has a `light` fill
  (the deep fill, for marks on light), a `text` tone (for links, labels and the wordmark letters on light), and a `dark`
  pastel (for marks and letters on dark).
- `src/outline.py`: turns a line of text into path data from the site's own fonts in `apps/site/public/fonts/`, so the
  wordmarks are outlines and need no font on the page.

Python is a design tool here. Nothing in the site build runs it.
