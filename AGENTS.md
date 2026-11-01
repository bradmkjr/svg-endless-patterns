# svg-endless-patterns

Next.js (App Router, Next 16 / React 19) + TypeScript site for customizing
traditional quilt blocks and knit and crochet stitch patterns. Exported as static files and hosted on GitHub Pages;
all generation is served by a separate API.

## Run
- `npm run dev` — http://localhost:3000
- `npm run build` — static export to `out/`
- `npm run lint`, `npm test`

## Git
Never commit or push. Leave changes in the working tree.

## Architecture: generation is in the API
All generation lives in the separate `api-endless-patterns` repository, behind one client:

- `src/lib/generator.ts` — the async client, and the only door to generation.
- `src/lib/<tool>Types.ts`, `src/lib/patternTypes.ts` — the JSON contract for each tool.
- `src/lib/state.ts`, `<tool>State.ts` — site concerns: options, palettes, defaults, share links.
- `src/lib/download.ts` — browser-only saving and SVG-to-PNG.

Requests use a versioned path (`/api/v1.0.1/maze`, version in `lib/mazeApi.ts`). The static site
needs `NEXT_PUBLIC_API_BASE_URL` at build time.

## Adding a block or stitch
Add it in the API repository: `src/engine/patterns/blocks.ts` or `stitchCatalog.ts`, with its text in
`src/engine/patterns/messages/`. Its tests check a block fills its grid exactly once and a stitch at every
width, but crochet stitches are counted rather than read, so proofread that text. Crochet terms are US.
Use traditional block names only, never catalog numbers, and add history only with a documented source.

Then regenerate `src/lib/patternCatalog.json` here and copy it to the API's
`test/fixtures/patternCatalog.json`, where a test fails if it's out of step. Each entry has one
`listBlocks` or `listStitchPatterns` result per language. The page and sitemap entry follow.

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
  Generated text (cuts, steps, rows, PDFs) lives with the engine, in the API repository.
- New text goes in all five languages. `lib/i18n.test.ts` fails on
  missing keys or mismatched placeholders and links.
- Link with `localePath`. Translations only change words, never numbers or geometry.
- A language changes one secondary color only, never the primary colors: the
  `--locale-swatch` token in `globals.css` and `lib/localeAccent.ts` for designs.

## Generators in the API
Everything generates in the private API
(routes under `/api/<version>/`). Here live only JSON types (`lib/<tool>Types.ts`), option
lists and state, builders, UI text and calls through `lib/generator.ts`. Builders read with
`lib/useLiveResult.ts`, blog samples with `ToolSample`, thumbnails with `thumbSrc`. A new option or default must also be added to the API's route schema and `engine/thumbs/<tool>.json`.


Pictures: the build asks the API for SVGs only. With `API_INTERNAL_URL` set, it saves one per
pattern from that URL (`app/previews/`) for every thumbnail, library image and related pattern
(`thumbSrc`); a failed request stops the build. Unset, those load from the public API instead.
A builder's main image is a plain `<img>` of a PNG on `NEXT_PUBLIC_API_BASE_URL`, in the static HTML
for bots (`ToolLoading`, `primaryImageSrc`), drawn only when requested. Live drawing replaces it
with SVG from the same public API.

## Tools
Each tool's files here: `lib/<tool>Types.ts` and `lib/<tool>State.ts`; `i18n/messages/<tool>.json` (all five
languages in one file, checked by the tool's test); a builder and a view; and routes in both trees. They connect
through `generator.ts`, the sitemap, `lib/libraryTools.ts`, sample kinds in `content.ts` and `PostSamples.tsx`, and
library text under `library.tools` in the shared catalogs.

## Option pages and thumbnails
A generator's main choice has its own page: list it in `lib/toolOptions.ts`, and add
`[option]` routes in both trees. Other settings stay in the query string. Thumbnails come from the API (see Pictures above).

## Page tags and share cards
Views build their title, description, canonical, Open Graph and Twitter tags with `pageMetadata`
(`lib/pageMetadata.ts`). `og:image` is always an API URL, drawn when asked for, never a file in the
build: `/card/<group>/<slug>.png` for a page with a pattern, `/card/default.png` otherwise. Pictures for a page's path come from `pathPicture`.

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
