# svg-endless-patterns

Customize traditional quilt blocks, then get a cutting list, yardage, seamless
SVG/PNG repeats and a printable PDF with true-size templates. It's a static
Next.js site for GitHub Pages, and everything is generated in the browser.

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

See [AGENTS.md](./AGENTS.md) for the architecture.
