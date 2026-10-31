# svg-endless-patterns

Next.js (App Router, Next 16 / React 19) + TypeScript site for customizing
traditional quilt blocks and knit and crochet stitch patterns. Exported as static files and hosted on GitHub Pages;
maze generation is served by a separate API.

## Run
- `npm run dev` — http://localhost:3000
- `npm run build` — static export to `out/`
- `npm run lint`, `npm test`

## Git
Never commit or push. Leave changes in the working tree.

## Architecture: generation is isolated
Generation stays behind one boundary while moving to a backend API:

- `src/engine/` — frontend-side generation: block catalog, geometry, cutting
  and yardage, SVG, templates, steps, PDF. No React, Next, DOM or `@/` imports.
- `src/engine/types.ts` — the contract: JSON-only requests and results.
- `src/lib/generator.ts` — async client and the only file that imports the
  engine. Maze requests go to `api-endless-patterns`; other generators still
  run in-process until they are moved.
- `src/lib/state.ts` — site concerns: options, palettes, defaults, share links.
- `src/lib/download.ts` — browser-only saving and SVG-to-PNG.

`src/engine/boundary.test.ts` fails if these rules break. Add new output
formats to the engine and expose them through `generator.ts`.

Mazes, fractals and knit colorwork all run this way. All maze generation and generated SVG, PNG, PDF and thumbnail images live in
the separate `api-endless-patterns` repository. The frontend sends maze
requests through `src/lib/generator.ts`, under a versioned path (`/api/v1.0.1/maze`, version in `lib/mazeApi.ts`); `src/lib/mazeTypes.ts` defines the
JSON contract. The static site needs `NEXT_PUBLIC_API_BASE_URL` at build time.

## Adding a block
Add it to `BLOCKS` in `src/engine/blocks.ts`, and its text to `src/engine/messages/`. Tests check that it fills its grid
exactly once and uses the fabrics it declares; its page and sitemap entry follow
automatically. Use traditional names only, never catalog numbers, and add history
only with a documented source.

## Adding a knit or crochet stitch
Add it to `src/engine/stitchCatalog.ts`, and its text to `src/engine/messages/`. Knit: give the chart, seen from the right
side, with an even row count; written rows are derived from it. Crochet: write the
row text with what each part consumes and makes. `stitch.test.ts` checks both at
every width, but it counts crochet stitches rather than reading the text, so
proofread that text. Crochet terms are US. The page and PDF write a complete square
from the row's consumes and makes in `engine/crochetSquare.ts` (text in
`engine/messages/crochetSquare.json`, read back by its test); a row shape it doesn't
know throws, so add its wording there.

## Announcing major features
Every major feature ships with all of these, in the same change:
1. A new post at the top of `src/content/blog.json`, with a `samples` block and links.
2. An entry at the top of `src/content/changelog.json`, with `post` set to its slug.
3. Translations of both in `src/content/i18n/`.

Smaller changes and fixes get a changelog entry only. A sample stores a tool, its
query string and a view; the preview is drawn from those same settings, and the link
opens with them. Leave out default values: `content.test.ts` fails on a setting that
doesn't survive the round trip, a broken internal link, or a post missing from the
changelog. Describe only what has shipped, and date entries with the day they ship.

## Blog and changelog storage
Both are JSON in `src/content/`, for a database later. Read them only through
`src/lib/content.ts`, which can become queries without changing its callers.

## Translations
English is at the root; `es`, `fr`, `de` and `pt` (Brazilian) sit under a prefix.
- `src/app/(en)` and `src/app/[locale]` are two root layouts, for a correct
  `<html lang>`. Their routes are thin: page bodies live in `src/views/` and take
  a `locale`. A new page needs a route in both trees, plus an entry in the sitemap.
- Site text: `src/i18n/messages/`. Post and changelog text: `src/content/i18n/`.
  Generated text (cuts, steps, rows, PDFs): `src/engine/messages/`, with English in
  `src/engine/i18n.ts`, so it moves with the engine.
- New text goes in all five languages. `i18n.test.ts` in `lib/` and `engine/` fail on
  missing keys or mismatched placeholders and links.
- Link with `localePath`. Translations only change words, never numbers or geometry.
- A language changes one secondary color only, never the primary colors: the
  `--locale-swatch` token in `globals.css` and `lib/localeAccent.ts` for designs.

## Tools
Tartans onward each own their files: `engine/<tool>.ts`, `<tool>Pdf.ts` and tests;
`engine/messages/<tool>.json` and `i18n/messages/<tool>.json` (all five languages in
one file, checked by the tool's test); `lib/<tool>State.ts`; a builder and a view; and
routes in both trees. They connect through `generator.ts`, `engine/index.ts`, the
sitemap, `lib/libraryTools.ts`, sample kinds in `content.ts` and `PostSamples.tsx`, and
library text under `library.tools` in the shared catalogs. `engine/wallpaper.ts` is the
reusable symmetry engine.

## Option pages and thumbnails
A generator's main choice has its own page: list it in `lib/toolOptions.ts`, and add
`[option]` routes in both trees. Other settings stay in the query string. Thumbnails are
static files from `app/thumbs/`, drawn in `lib/thumbnails.ts`.

## Palettes
The library is `lib/palettes.ts`, saved palettes `lib/customPalettes.ts` (this browser's
local storage). Builders use `PalettePicker`: the first color is a ground, the second main.

## Crediting sources
Any figure, method or text taken from outside goes in `lib/references.ts` with its link and
what it's used for, shows on the tool with `References`, and appears on `/acknowledgements/`.
A PDF that relies on a source prints its link.

## Static export limits
No route handlers that read the request, redirects, headers, proxy or server
actions. Link with `next/link` so the base path is applied, and with trailing
slashes. Builder state lives in the query string, read on the client.

## Versioning
`.githooks/pre-commit` bumps the patch version on commit; the footer shows it.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
