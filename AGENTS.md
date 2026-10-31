# svg-endless-patterns

Next.js (App Router, Next 16 / React 19) + TypeScript site for customizing
traditional quilt blocks and knit and crochet stitch patterns. Exported as static files and hosted on GitHub Pages;
there is no backend yet.

## Run
- `npm run dev` — http://localhost:3000
- `npm run build` — static export to `out/`
- `npm run lint`, `npm test`

## Git
Never commit or push. Leave changes in the working tree.

## Architecture: generation is isolated
Generation will move to a backend API, so it stays behind one boundary:

- `src/engine/` — all generation: block catalog, geometry, cutting and yardage,
  SVG, templates, steps, PDF. No React, Next, DOM or `@/` imports.
- `src/engine/types.ts` — the contract: JSON-only requests and results.
- `src/lib/generator.ts` — async client and the only file that imports the
  engine. To move to an API, replace its function bodies with `fetch` calls.
- `src/lib/state.ts` — site concerns: options, palettes, defaults, share links.
- `src/lib/download.ts` — browser-only saving and SVG-to-PNG.

`src/engine/boundary.test.ts` fails if these rules break. Add new output
formats to the engine and expose them through `generator.ts`.

## Adding a block
Add it to `BLOCKS` in `src/engine/blocks.ts`. Tests check that it fills its grid
exactly once and uses the fabrics it declares; its page and sitemap entry follow
automatically. Use traditional names only, never catalog numbers, and add history
only with a documented source.

## Adding a knit or crochet stitch
Add it to `src/engine/stitchCatalog.ts`. Knit: give the chart, seen from the right
side, with an even row count; written rows are derived from it. Crochet: write the
row text with what each part consumes and makes. `stitch.test.ts` checks both at
every width, but it counts crochet stitches rather than reading the text, so
proofread that text. Crochet terms are US.

## Planned pattern makers
`src/lib/patternPages.ts` lists tools that don't exist yet. Their pages are
`noindex` and stay out of the sitemap. When one ships, put its generation in
`src/engine/` behind `generator.ts`, give it a real route, and remove its entry.

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
