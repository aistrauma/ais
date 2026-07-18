# Publishing a Note

Notes are public educational quick references. Each note is a reviewed Markdown file in `notes/`, then the GitHub Pages build validates and publishes it with the static site.

## Before you write

Start with primary or other authoritative sources. Complete separate clinical review before publication. Do not include protected health information or patient-specific details.

If the note needs a new category, add that category to `notes/categories.json` first. A note can only use a category listed there, which keeps category filters consistent.

## File format

Create one Markdown file in `notes/`. The filename is for repository organization; the front-matter `slug` is the public identifier.

Use this schema exactly:

```yaml
---
title: Interpreting a TEG
slug: teg-interpretation
category: Resuscitation
tags:
  - TEG
  - coagulopathy
  - transfusion
summary: Rapid interpretation of common TEG abnormalities and targeted treatment.
last_reviewed: 2026-07-17
sources:
  - title: Source title
    url: https://example.org/source
---
```

Then add the Markdown body below the closing `---`.

Every field is required:

- `title`: a concise, human-readable title.
- `slug`: a unique lowercase URL-safe identifier matching `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
- `category`: one exact value from `notes/categories.json`.
- `tags`: one or more non-empty search terms.
- `summary`: a short description for the result card.
- `last_reviewed`: a real ISO date in `YYYY-MM-DD` format.
- `sources`: one or more entries, each with a title and a valid HTTPS URL.

Keep the slug stable after publication. It forms the shareable route `#notes/<slug>`, so changing it breaks existing links. Correct a note’s title or body without changing its slug whenever possible.

The body supports headings, paragraphs, ordered and unordered lists, tables, emphasis, blockquotes, inline code, code blocks, horizontal rules, and HTTPS links. Unsupported or unsafe HTML is removed during the build.

## Validate and preview

From the repository root, install the pinned dependencies and run the checks:

```bash
npm ci
npm test
npm run build
```

Or run both tests and the build together:

```bash
npm run check
```

The build creates `site/generated/` and updates the service-worker metadata. Those generated files are not hand-edited source files.

From the repository root, preview the built site with:

```bash
python3 -m http.server 8742 --directory site
```

Open http://localhost:8742/. Confirm the note appears in Notes search and its category filter, opens in the full view, and works at `#notes/<slug>`. Stop the server after the check.

## Clinical publication checklist

Before requesting review, confirm all of the following:

- Sources are primary or otherwise authoritative, current, and linked with HTTPS.
- The note’s `last_reviewed` date reflects the current review.
- The content contains no PHI or patient-specific details.
- The note is educational and does not replace institutional protocols, clinical judgment, or current primary guidance.
- Separate clinical review has occurred before publication.

## GitHub workflow

1. Add one Markdown file in `notes/`, updating `notes/categories.json` first if a new category is needed.
2. Run `npm ci`, `npm test`, and `npm run build` locally.
3. Preview the built site and verify the note route and metadata.
4. Commit the source note and any category change, then push the feature branch.
5. Open a GitHub review, address feedback, and merge only after the required clinical review is complete.
6. Verify the GitHub Pages workflow after the merge to `main`; only that workflow publishes the live site.
