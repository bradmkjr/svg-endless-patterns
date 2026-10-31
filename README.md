# svg-endless-patterns

Customize traditional quilt blocks, then get a cutting list, yardage, seamless
SVG/PNG repeats and a printable PDF with true-size templates. Knit and crochet
stitch patterns get a starting count, written rows and a chart for your gauge.
It's a static Next.js site for GitHub Pages; maze generation runs through the
separate API service.

```bash
npm install
npm run dev     # http://localhost:3000
npm test
npm run build   # static site in out/
```

## Deploy

`.github/workflows/deploy.yml` tests, builds and publishes on every push to
`main`. One setup step is needed first: in the repository's **Settings → Pages**,
set **Source** to **GitHub Actions**. Publishing from a private repository needs
a paid GitHub plan.

The workflow gets the base path and URL from GitHub, so a custom domain needs no
code change.

The maze builder and all of its generated images (SVG, PNG, PDF, samples and
thumbnails) use the separate [api-endless-patterns](/Users/bradmkjr/Repos/api-endless-patterns)
service. Set the GitHub repository variable `ENDLESS_PATTERNS_API_URL` to the
deployed API origin, and configure the API's `CORS_ORIGIN` to allow
`https://endless-patterns.com`. For local development, set
`NEXT_PUBLIC_API_BASE_URL=http://localhost:4000` in `.env.local` and run the API
on port 4000.

See [AGENTS.md](./AGENTS.md) for the architecture.
