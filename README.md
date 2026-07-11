# AIS 2008 Trauma Reference

A single-file web app for AIS 2008 trauma coding: searchable codes with severity grades and OIS mapping, the manual rendered alongside with pdf.js, TQIP/NTDS documentation templates, and an AI assistant for example notes. Installs as a PWA and works fully offline.

**Live site:** https://aistrauma.github.io/ais/ (also at https://aistrauma.netlify.app)

## Structure

- `site/` — the entire app. `index.html` is self-contained (no build step, no CDNs); pdf.js is vendored in `site/assets/`, and the AIS 2008 manual PDF loads lazily from there. `sw.js` precaches everything for offline use.
- `netlify/functions/assistant.mjs` — the one server-side piece: a proxy to the Gemini API for the AI assistant. Runs on Netlify; the GitHub Pages deployment calls it cross-origin.
- `.github/workflows/pages.yml` — deploys `site/` to GitHub Pages on every push to `main`.

## Deploying

Push to `main` and GitHub Actions publishes `site/` to GitHub Pages. When changing any file in `site/`, bump the `CACHE` version string in `site/sw.js` so installed clients pick up the update.

The Netlify deployment (which hosts the AI function) is deployed separately with `npx netlify-cli deploy --prod`.

## Disclaimer

Reference tool for trauma coding education. Verify codes against the official AIS 2008 manual and your institution's requirements.
