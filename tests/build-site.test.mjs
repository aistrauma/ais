import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildProject, buildSite } from "../scripts/build-site.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const VALID_NOTE = `---
title: Interpreting a TEG
slug: teg-interpretation
category: Resuscitation
tags: [TEG, coagulopathy]
summary: Rapid interpretation and targeted treatment.
last_reviewed: 2026-07-17
sources:
  - title: ACS guidance
    url: https://www.facs.org/
---
## Key thresholds

- Treat the patient, not an isolated number.
`;

const VALID_GUIDE_NOTE = `---
title: Initial Immobilization Guide
slug: initial-immobilization-guide
category: Resuscitation
tags: [splinting, immobilization]
summary: Initial immobilization options by injury pattern.
last_reviewed: 2026-07-19
sources:
  - title: ACS guidance
    url: https://www.facs.org/
---
## Distal radius fracture

Use a sugar-tong splint for initial immobilization.
`;

const GUIDE_ENTRY = {
  id: "distal-radius-fracture",
  section: "Upper extremity",
  label: "Distal radius fracture",
  device: "Sugar-tong splint",
  bullets: ["Control wrist motion.", "Limit forearm rotation.", "Recheck distal neurovascular status."],
  warning: "Avoid excessive wrist flexion or tight wrapping.",
  headingId: "distal-radius-fracture",
  searchTerms: ["wrist", "colles", "radius"]
};

async function createRepository({ note } = {}) {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "ais-build-"));
  await mkdir(path.join(repoRoot, "notes"));
  await mkdir(path.join(repoRoot, "site"));
  await writeFile(path.join(repoRoot, "notes", "categories.json"), JSON.stringify(["Resuscitation"]));
  await writeFile(path.join(repoRoot, "site", "index.html"), "<!doctype html><title>AIS</title>");
  if (note) await writeFile(path.join(repoRoot, "notes", "teg.md"), note);
  return repoRoot;
}

test("builds a note index, HTML fragment, and cache metadata", async () => {
  const repoRoot = await createRepository({ note: VALID_NOTE });

  const result = await buildSite({ repoRoot });

  assert.equal(result.noteCount, 1);
  const index = JSON.parse(await readFile(path.join(repoRoot, "site/generated/notes-index.json"), "utf8"));
  assert.equal(index.notes[0].fragment, "generated/notes/teg-interpretation.html");
  assert.equal(index.notes[0].html, undefined);
  assert.equal(index.notes[0].sections, undefined);
  assert.match(await readFile(path.join(repoRoot, "site/generated/notes/teg-interpretation.html"), "utf8"), /Key thresholds/);
  const swMeta = await readFile(path.join(repoRoot, "site/generated/sw-meta.js"), "utf8");
  assert.match(swMeta, /self\.AIS_BUILD_ID = "[a-f0-9]{12}"/);
  assert.match(swMeta, /generated\/notes\/teg-interpretation\.html/);
});

test("builds and precaches the initial immobilization guide index and section fragments", async () => {
  const repoRoot = await createRepository({ note: VALID_GUIDE_NOTE });

  await buildSite({ repoRoot, guideEntries: [GUIDE_ENTRY] });

  const guide = JSON.parse(await readFile(path.join(repoRoot, "site/generated/immobilization-guide.json"), "utf8"));
  assert.equal(guide.entries[0].detailFragment, "generated/notes/initial-immobilization-guide/distal-radius-fracture.html");
  assert.match(
    await readFile(path.join(repoRoot, "site/generated/notes/initial-immobilization-guide/distal-radius-fracture.html"), "utf8"),
    /Use a sugar-tong splint/
  );
  const swMeta = await readFile(path.join(repoRoot, "site/generated/sw-meta.js"), "utf8");
  assert.match(swMeta, /generated\/immobilization-guide\.json/);
  assert.match(swMeta, /generated\/notes\/initial-immobilization-guide\/distal-radius-fracture\.html/);
});

test("the production build uses the canonical immobilization guide data", async () => {
  const repoRoot = await createRepository();
  await writeFile(path.join(repoRoot, "notes/categories.json"), JSON.stringify(["Orthopedics"]));
  await writeFile(
    path.join(repoRoot, "notes/initial-immobilization-guide.md"),
    await readFile(path.join(PROJECT_ROOT, "notes/initial-immobilization-guide.md"), "utf8")
  );

  await buildProject({ repoRoot });

  const guide = JSON.parse(await readFile(path.join(repoRoot, "site/generated/immobilization-guide.json"), "utf8"));
  assert.equal(guide.entries.length, 30);
  assert.ok(guide.entries.some(entry => entry.id === "traction-splint-contraindications"));
});

test("builds an empty note index and precaches it", async () => {
  const repoRoot = await createRepository();

  await buildSite({ repoRoot });

  const index = JSON.parse(await readFile(path.join(repoRoot, "site/generated/notes-index.json"), "utf8"));
  assert.deepEqual(index.notes, []);
  const swMeta = await readFile(path.join(repoRoot, "site/generated/sw-meta.js"), "utf8");
  assert.match(swMeta, /\.\/generated\/notes-index\.json/);
});

test("changes the build ID when bytes move between similarly named assets", async () => {
  const firstRepo = await createRepository();
  const secondRepo = await createRepository();
  await writeFile(path.join(firstRepo, "site", "a"), "b");
  await writeFile(path.join(firstRepo, "site", "b"), "");
  await writeFile(path.join(secondRepo, "site", "a"), "");
  await writeFile(path.join(secondRepo, "site", "b"), "b");

  const first = await buildSite({ repoRoot: firstRepo });
  const second = await buildSite({ repoRoot: secondRepo });

  assert.notEqual(first.buildId, second.buildId);
});

test("GitHub Pages validates pull requests and deploys only after main or manual validation", async () => {
  const serviceWorker = await readFile(path.join(PROJECT_ROOT, "site/sw.js"), "utf8");
  assert.match(serviceWorker, /importScripts\("\.\/generated\/sw-meta\.js"\)/);
  assert.match(serviceWorker, /self\.AIS_BUILD_ID/);
  assert.match(serviceWorker, /self\.AIS_PRECACHE/);
  assert.doesNotMatch(serviceWorker, /netlify/i);

  const workflow = await readFile(path.join(PROJECT_ROOT, ".github/workflows/pages.yml"), "utf8");
  assert.match(workflow, /pull_request:/);
  assert.doesNotMatch(workflow, /^concurrency:\n  group: pages/m);
  const validate = workflow.slice(workflow.indexOf("  validate:"), workflow.indexOf("  deploy:"));
  const deploy = workflow.slice(workflow.indexOf("  deploy:"));
  assert.match(validate, /npm ci[\s\S]*npm test[\s\S]*npm run build/);
  assert.doesNotMatch(validate, /actions\/deploy-pages/);
  assert.match(deploy, /needs: validate/);
  assert.match(deploy, /concurrency:\n      group: pages\n      cancel-in-progress: true/);
  assert.match(deploy, /if: github\.ref == 'refs\/heads\/main' && \(github\.event_name == 'push' \|\| github\.event_name == 'workflow_dispatch'\)/);
  assert.match(deploy, /actions\/deploy-pages@v4/);
});

test("generates identical output for identical builds", async () => {
  const repoRoot = await createRepository({ note: VALID_NOTE });

  await buildSite({ repoRoot });
  const firstIndex = await readFile(path.join(repoRoot, "site/generated/notes-index.json"));
  const firstMeta = await readFile(path.join(repoRoot, "site/generated/sw-meta.js"));

  await buildSite({ repoRoot });
  assert.deepEqual(await readFile(path.join(repoRoot, "site/generated/notes-index.json")), firstIndex);
  assert.deepEqual(await readFile(path.join(repoRoot, "site/generated/sw-meta.js")), firstMeta);
});
