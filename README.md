# AIS 2008 Trauma Reference

A static reference app for AIS 2008 trauma coding education. It includes searchable AIS codes with severity grades and OIS mapping, a Markdown-backed Notes library, collapsible TQIP rules, documentation templates, an AIS manual viewer, and offline PWA support.

**Live site:** https://aistrauma.github.io/ais/

## What it includes

- **AIS search** with code lookup, severity filtering, OIS mapping, and curated result cards.
- **Notes** with keyword search, category filters, stable shareable URLs, visible sources, and last-reviewed dates.
- **TQIP Rules** organized as collapsed-by-default sections with expand-all and collapse-all controls.
- **Templates** for common trauma documentation workflows.
- **PDF viewer** for the AIS 2008 manual.
- **Offline PWA behavior** after a successful online load, including generated Notes assets.

## Repository layout

- `notes/` contains one Markdown source file per published note. Categories are maintained in `notes/categories.json`.
- `scripts/` validates and builds the Notes library.
- `tests/` contains automated checks for note compilation, Notes behavior, TQIP accordions, build output, and regressions.
- `site/` is the static application published to GitHub Pages.
- `.github/workflows/pages.yml` validates, builds, and deploys `site/` when changes reach `main`.

## Develop and check changes

Use the lockfile for a reproducible install, then run the checks before committing:

```bash
npm ci
npm test
npm run build
```

`npm run check` runs the test suite followed by the build. The build validates Notes and writes generated assets to `site/generated/`; do not hand-edit those files.

To preview the built site locally:

```bash
python3 -m http.server 8742 --directory site
```

Open http://localhost:8742/ and stop the server when you finish testing.

## Publish a Note

See [the Notes authoring guide](docs/notes-authoring.md) for the required metadata, clinical review checklist, local preview steps, and GitHub review workflow.

## Deploy

GitHub Pages is the sole deployment path. The workflow in `.github/workflows/pages.yml` runs on pushes to `main`, installs dependencies with `npm ci`, runs tests and the build, then publishes `site/` to https://aistrauma.github.io/ais/.

Review feature branches before merging. A push to a feature branch does not update the live site.

## Disclaimer

This is an educational trauma coding reference. Verify codes against the official AIS 2008 manual, current primary guidance, institutional protocols, and clinical judgment.
