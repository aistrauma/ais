import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { buildSite } from "../scripts/build-site.mjs";

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
  assert.match(await readFile(path.join(repoRoot, "site/generated/notes/teg-interpretation.html"), "utf8"), /Key thresholds/);
  const swMeta = await readFile(path.join(repoRoot, "site/generated/sw-meta.js"), "utf8");
  assert.match(swMeta, /self\.AIS_BUILD_ID = "[a-f0-9]{12}"/);
  assert.match(swMeta, /generated\/notes\/teg-interpretation\.html/);
});

test("builds an empty note index and precaches it", async () => {
  const repoRoot = await createRepository();

  await buildSite({ repoRoot });

  const index = JSON.parse(await readFile(path.join(repoRoot, "site/generated/notes-index.json"), "utf8"));
  assert.deepEqual(index.notes, []);
  const swMeta = await readFile(path.join(repoRoot, "site/generated/sw-meta.js"), "utf8");
  assert.match(swMeta, /\.\/generated\/notes-index\.json/);
});
