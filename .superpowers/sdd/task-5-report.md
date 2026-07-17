# Task 5 Report: Remove AI Assistant and Netlify

## Result

Removed the deployed AI assistant runtime and all tracked Netlify configuration while preserving the five core views and AIS PDF/data references.

## RED evidence

Created `tests/repository-regression.test.mjs` before changing production code. Running `node --test tests/repository-regression.test.mjs` failed as expected:

```
AssertionError: The input was expected to not match /aiSend/i
```

The companion core-view test passed, confirming the gate targeted the residual AI code.

## GREEN evidence

After removal, `node --test tests/repository-regression.test.mjs` passed both tests:

```
pass 2
fail 0
```

The exact required `VIEWS` mapping remains:

```js
const VIEWS = { search:"viewSearch", templates:"viewTemplates", tqip:"viewTQIP", notes:"viewNotes", settings:"viewSettings" };
```

## Deletion evidence

- Deleted `netlify/functions/assistant.mjs`.
- Deleted `netlify.toml`.
- Removed `.netlify` and its explanatory comment from `.gitignore` without touching any local ignored directory.
- Removed the AI CSS block and the browser-side quota, endpoint, request, and clipboard code from `site/index.html`.
- Repository search for `AI Assistant|Gemini|GOOGLE_AI_KEY|.netlify/functions/assistant|viewAI|aiSend|aiQuota` across `site`, `netlify.toml`, and `netlify` produced no matches.
- `git ls-files netlify netlify.toml` produced no tracked paths after the staged deletions.

## Tests

- `node --test tests/repository-regression.test.mjs`: 2 passed, 0 failed.
- `npm test`: 27 passed, 0 failed.
- `git diff --check` and `git diff --cached --check`: clean.

## Files changed

- `.gitignore`
- `site/index.html`
- `tests/repository-regression.test.mjs`
- Deleted: `netlify/functions/assistant.mjs`
- Deleted: `netlify.toml`

## Concerns

None. The application is now static-host compatible; Netlify-specific deployment and AI assistant functionality are intentionally removed.

## Fix After Review

Expanded `tests/repository-regression.test.mjs` to recursively inspect deployed text assets beneath `site/` with these extensions: `.html`, `.js`, `.css`, `.json`, and `.webmanifest`. The gate now rejects `AI Assistant`, `Gemini`, `GOOGLE_AI_KEY`, `.netlify`, `viewAI`, `aiSend`, and `aiQuota` in every scanned asset while retaining the existing core-view and AIS PDF assertions.

### RED evidence

After the test expansion and before editing production code:

```
node --test tests/repository-regression.test.mjs

AssertionError [ERR_ASSERTION]: site/sw.js must not contain .netlify
```

The focused gate reported 1 passing test and 1 failing test. The failing match identified the service worker's remaining Netlify path exception.

### GREEN evidence

Removed the AI-endpoint comment and the `/.netlify/` exception from `site/sw.js`. The worker still only caches same-origin GET requests.

```
node --test tests/repository-regression.test.mjs

pass 2
fail 0
```

```
npm test

pass 27
fail 0
```

`git diff --check` completed with no output.
