# svg-endless-patterns

Next.js (App Router, Next 16 / React 19) + TypeScript site for customizing
traditional quilt blocks. Exported as static files and hosted on GitHub Pages;
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

## Static export limits
No route handlers that read the request, redirects, headers, proxy or server
actions. Link with `next/link` so the base path is applied, and with trailing
slashes. Builder state lives in the query string, read on the client.

## Versioning
`.githooks/pre-commit` bumps the patch version on commit; the footer shows it.
