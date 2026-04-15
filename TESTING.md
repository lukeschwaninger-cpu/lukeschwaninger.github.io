# Testing

This site uses a small local testing pipeline designed for a static GitHub Pages portfolio.

## Install

```bash
npm install
npx playwright install chromium
```

## Run the local server

```bash
npm start
```

The site will be served at `http://127.0.0.1:4173`.

## Run tests

Run the full pipeline:

```bash
npm test
```

Run only the static link and asset checks:

```bash
npm run test:links
```

Run only the Playwright browser tests:

```bash
npm run test:e2e
```

## What is covered

- local static serving
- broken local links and local asset references
- major page navigation
- key asset availability
- responsive smoke checks
- basic SEO metadata checks
- lightweight accessibility checks for image alt text and document structure
