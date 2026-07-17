# AIS Notes Library and TQIP Accordions Design

**Date:** 2026-07-17  
**Status:** Approved design, pending specification review  
**Canonical site:** https://aistrauma.github.io/ais/  
**Canonical repository:** https://github.com/aistrauma/ais

## Outcome

Replace the AI Assistant with a public, searchable quick-reference Notes library. Notes will be written as Markdown, reviewed in GitHub, and published automatically with the rest of the static site. The TQIP Rules tab will also gain collapsed-by-default sections with controls to expand or collapse all sections.

This change makes GitHub Pages the site's only deployment. It removes the AI and Netlify runtime dependency while preserving the existing AIS search, templates, PDF viewer, PWA installation, and offline behavior.

## Scope

### Included

- Remove the AI Assistant tab, interface, client code, Netlify function, warnings, and related documentation.
- Remove Netlify from the deployment workflow and project documentation.
- Add a Notes tab in the navigation position previously occupied by AI Assistant.
- Store each note in a separate Markdown file.
- Generate validated note HTML and a client-side search index during the GitHub Actions build.
- Support dedicated keyword search, category filtering, result cards, full note views, and stable shareable note URLs.
- Require sources and a last-reviewed date for every published note.
- Include all published notes in the PWA's offline experience.
- Convert major TQIP rule sections into accessible accordions.
- Add Expand all and Collapse all controls to the TQIP Rules tab.
- Add automated checks for note validation and existing-site regressions.

### Excluded

- Writing or medically reviewing the initial clinical note library. Clinical content will be added through separate, source-backed changes.
- User-created or private notes.
- Accounts, synchronization, comments, ratings, or other server-side features.
- Changes to AIS dictionary data, curated AIS cards, or the embedded manual.
- Redesigning unrelated tabs or visual systems.

## Architecture

The deployed site remains static and serverless. A small Node-based build step will process Markdown at build time; the browser will not download a Markdown parser or any other runtime package.

The repository will add these logical units:

- `notes/`: one source Markdown file per published note.
- Note validator: checks metadata, unique slugs, valid dates, supported categories, and source completeness.
- Note renderer: converts trusted repository Markdown into sanitized static HTML.
- Search index generator: produces compact JSON containing metadata and normalized searchable text.
- Notes browser controller: handles search, categories, result cards, full note views, and hash routing.
- TQIP accordion controller: manages individual sections and the expand/collapse-all controls.

The existing single-file application can remain the visual shell. Generated note assets will sit alongside it in the published `site/` output. Build artifacts must not become hand-edited source files.

## Note Source Format

Every note is a Markdown file with required front matter:

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

Required fields:

- `title`: concise human-readable title.
- `slug`: unique, lowercase, URL-safe identifier that remains stable after publication.
- `category`: one value from the maintained category list.
- `tags`: one or more search terms.
- `summary`: short result-card description.
- `last_reviewed`: ISO date in `YYYY-MM-DD` format.
- `sources`: one or more entries with a title and valid HTTPS URL.

The Markdown body may use flexible headings, paragraphs, lists, tables, emphasis, and links. A note does not need to follow a rigid clinical template. The renderer will preserve a consistent visual hierarchy around whatever headings suit the topic.

Categories will be maintained in one configuration file so misspellings cannot silently create duplicate filters. The initial category list should be chosen when the first notes are authored, based on the actual content rather than speculative categories.

## Notes Experience

### Landing view

The Notes tab contains:

- A dedicated search input that does not alter the AIS code search.
- Category filter chips, including an All category.
- A result count.
- Compact result cards with title, category, summary, tags, and last-reviewed date.
- A clear empty-library state before the first clinical notes are published.
- A no-results state that preserves the current query and suggests clearing filters.

Keyword search covers the note title, category, tags, summary, headings, and body text. Search is case-insensitive and combines with the selected category using AND behavior. Results are ranked with title and tag matches above body-only matches.

### Full note view

Selecting a result opens one focused, full-page card within the application shell. It includes:

- Back to Notes control.
- Title, category, tags, and last-reviewed date.
- Rendered note body.
- Sources section at the bottom.
- Existing site disclaimer language adapted for educational quick-reference content.

The route uses a stable hash such as `#notes/teg-interpretation`. Opening or refreshing that URL loads the correct note. An unknown or removed slug returns the user to Notes with a clear note-not-found message.

Back navigation should restore the prior search query, selected category, and scroll position during the current visit.

## TQIP Rules Accordions

Each major TQIP rule group becomes an independent disclosure component:

- Collapsed by default on a fresh visit.
- Entire heading row is clickable.
- Chevron communicates state visually.
- `aria-expanded` and `aria-controls` communicate state to assistive technology.
- Enter and Space toggle the focused section.
- Expand all and Collapse all controls appear above the rule groups.
- Open and closed states persist while the user remains on the page, but reset to collapsed on a new visit.

The underlying TQIP wording and ordering will not change as part of this feature.

## AI and Netlify Removal

Removal includes:

- AI Assistant navigation button and view markup.
- AI-specific styles, prompts, examples, request limits, clipboard behavior, and client request code.
- `netlify/functions/assistant.mjs` and any Netlify-only configuration that no longer serves another purpose.
- Gemini and Netlify environment-variable documentation.
- Cross-origin assistant endpoint logic.
- Netlify deployment instructions and references that imply Netlify remains canonical.

The removal must be verified with repository-wide searches for AI Assistant, Gemini, the assistant endpoint, the Netlify function, and the `GOOGLE_AI_KEY` variable. Historical notes in project memory are not deployed application code and do not need rewriting.

## Build and Deployment Flow

On pull requests and pushes to `main`, GitHub Actions will:

1. Install pinned build dependencies.
2. Validate every Markdown note.
3. Convert Markdown to sanitized static HTML.
4. Generate the notes metadata and search index.
5. Generate or update the service-worker cache identifier from the built content.
6. Run automated tests.
7. Publish the static `site/` output to GitHub Pages only after all checks pass.

Validation errors must identify the file and field that failed. Production deployment is blocked for missing metadata, invalid dates or source URLs, duplicate slugs, unknown categories, unsafe rendered output, or broken generated assets.

The build must also succeed when `notes/` contains no clinical notes. In that state it generates an empty index and publishes the Notes landing screen's empty-library message.

## Offline Behavior and Failure Isolation

Generated note pages and the search index are included in the service-worker cache. After the current version has been installed successfully, all published notes remain available offline.

If note assets cannot load, the Notes tab shows a readable error with a retry control. Other tabs continue to work. A failure in the notes subsystem must not block AIS code search, templates, TQIP rules, or the PDF viewer.

External source links open separately and are allowed to fail offline without affecting the note itself.

## Clinical Safety

- Notes are labeled as educational quick references, not substitutes for institutional protocols, clinical judgment, or current primary guidance.
- Every note visibly displays sources and its last-reviewed date.
- The build rejects notes with no sources or review date.
- No AI-generated clinical response remains in the deployed product.
- AIS dictionary data and manual content are outside this change's editing scope.
- Clinical note content requires separate source review before publication.

## Testing and Acceptance Criteria

### Build validation

- Valid note fixtures build successfully.
- An empty `notes/` directory builds successfully and produces an empty search index.
- Missing required fields fail with file-specific errors.
- Duplicate slugs, invalid dates, invalid source URLs, and unknown categories fail.
- Generated note HTML is sanitized.
- Generated search data contains no Markdown syntax or unsafe HTML.

### Notes behavior

- Search matches titles, tags, categories, summaries, headings, and body text.
- Title and tag matches rank above body-only matches.
- Category filters combine correctly with keyword search.
- Note cards display the required metadata.
- Full note views render supported Markdown correctly.
- Sources and last-reviewed dates are visible.
- Stable note hashes survive direct loading and refresh.
- Back navigation restores Notes state.
- Empty, no-results, load-error, and note-not-found states are readable.

### TQIP behavior

- All major rule groups are collapsed on a fresh visit.
- Individual sections toggle by pointer and keyboard.
- Expand all and Collapse all produce accurate controls and ARIA state.
- Section state survives navigation away from and back to the TQIP tab during the current visit.
- TQIP wording and order remain unchanged.

### Regression and deployment

- Repository-wide checks find no deployed AI Assistant, Gemini, assistant endpoint, or Netlify function code.
- AIS search, fuzzy suggestions, severity filtering, curated cards, templates, PDF viewer, PWA installation, and offline mode continue to work.
- Desktop and mobile navigation display Notes correctly.
- GitHub Actions publishes the built site to https://aistrauma.github.io/ais/.
- No Netlify deployment is required.

## Implementation Boundaries

The change should introduce only the structure required for Markdown notes, notes discovery, full note views, TQIP accordions, build validation, and GitHub Pages publishing. It should not refactor the large AIS dataset or redesign unrelated screens.

Because the current `site/index.html` contains layout, data, and behavior together, the implementation may extract only the new Notes and TQIP behavior into focused local modules if that reduces risk. Any extraction must preserve the app's no-runtime-server constraint and existing deployment behavior.
