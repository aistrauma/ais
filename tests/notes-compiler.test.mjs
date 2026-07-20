import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { compileNotes, parseNoteSource } from "../scripts/lib/notes.mjs";

const VALID = `---
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
<script>alert("unsafe")</script>
`;

test("parses, sanitizes, and normalizes a valid note", () => {
  const note = parseNoteSource({
    source: VALID,
    filePath: "notes/teg.md",
    categories: ["Resuscitation"]
  });
  assert.equal(note.slug, "teg-interpretation");
  assert.match(note.html, /<h2 id="key-thresholds">Key thresholds<\/h2>/);
  assert.doesNotMatch(note.html, /<script/i);
  assert.match(note.searchText, /interpreting a teg key thresholds/i);
});

test("adds stable heading IDs and extracts H2 sections", () => {
  const note = parseNoteSource({
    source: VALID.replace(
      "## Key thresholds",
      "## Distal Radius Fracture\n\nQuick text.\n\n## Distal Radius Fracture"
    ),
    filePath: "notes/immobilization.md",
    categories: ["Resuscitation"]
  });
  assert.match(note.html, /<h2 id="distal-radius-fracture">/);
  assert.match(note.html, /<h2 id="distal-radius-fracture-2">/);
  assert.deepEqual(note.sections.map(section => section.id), [
    "distal-radius-fracture",
    "distal-radius-fracture-2"
  ]);
  assert.match(note.sections[0].html, /Quick text/);
});

test("reports all invalid metadata fields in one error", () => {
  const bad = VALID
    .replace("slug: teg-interpretation", "slug: TEG notes")
    .replace("category: Resuscitation", "category: Unknown")
    .replace("last_reviewed: 2026-07-17", "last_reviewed: 07/17/26")
    .replace("https://www.facs.org/", "http://example.com/");
  assert.throws(
    () => parseNoteSource({ source: bad, filePath: "notes/bad.md", categories: ["Resuscitation"] }),
    error => ["slug", "category", "last_reviewed", "sources[0].url"].every(field => error.message.includes(field))
  );
});

test("compiles an empty notes directory", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "ais-notes-"));
  const notesDir = path.join(root, "notes");
  await mkdir(notesDir);
  assert.deepEqual(await compileNotes({ notesDir, categories: [] }), []);
});

test("rejects duplicate slugs with both filenames", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "ais-notes-"));
  const notesDir = path.join(root, "notes");
  await mkdir(notesDir);
  await writeFile(path.join(notesDir, "one.md"), VALID);
  await writeFile(path.join(notesDir, "two.md"), VALID.replace("Interpreting a TEG", "TEG Quick Guide"));
  await assert.rejects(
    compileNotes({ notesDir, categories: ["Resuscitation"] }),
    /duplicate slug.*one\.md.*two\.md/i
  );
});
