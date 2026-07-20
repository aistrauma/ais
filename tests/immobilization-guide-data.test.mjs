import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { IMMOBILIZATION_GUIDE_ENTRIES } from "../notes/initial-immobilization-guide.data.mjs";
import { compileImmobilizationGuide } from "../scripts/lib/immobilization-guide.mjs";
import { parseNoteSource } from "../scripts/lib/notes.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const ENTRY = {
  id: "distal-radius-fracture",
  section: "Upper extremity",
  label: "Distal radius fracture",
  device: "Sugar-tong splint",
  bullets: ["Control wrist motion.", "Limit forearm rotation.", "Recheck distal neurovascular status."],
  warning: "Avoid excessive wrist flexion or tight wrapping.",
  diagram: "sugar-tong",
  headingId: "distal-radius-fracture",
  searchTerms: ["wrist", "colles", "radius"],
  diagramAlt: "Sugar-tong splint running from the hand around the elbow and back to the hand."
};

test("compiles complete guide metadata against note sections", () => {
  const result = compileImmobilizationGuide({
    note: {
      title: "Initial Immobilization Guide",
      slug: "initial-immobilization-guide",
      lastReviewed: "2026-07-19",
      sources: [],
      sections: [{ id: "distal-radius-fracture", html: "<h2>Distal radius fracture</h2>" }]
    },
    entries: [ENTRY]
  });
  assert.equal(result.version, 1);
  assert.equal(result.entries[0].detailFragment, "generated/notes/initial-immobilization-guide/distal-radius-fracture.html");
});

test("rejects unknown headings, diagrams, duplicate IDs, and short bullet lists", () => {
  assert.throws(() => compileImmobilizationGuide({
    note: {
      title: "Guide",
      slug: "initial-immobilization-guide",
      lastReviewed: "2026-07-19",
      sources: [],
      sections: []
    },
    entries: [{ ...ENTRY, diagram: "missing", bullets: ["Only one"] }, { ...ENTRY }]
  }), /headingId.*diagram.*bullets.*duplicate/i);
});

test("real guide data covers the approved content scope", () => {
  assert.deepEqual([...new Set(IMMOBILIZATION_GUIDE_ENTRIES.map(item => item.section))], [
    "Upper extremity", "Lower extremity", "General principles", "Analgesia", "Traction"
  ]);
  for (const id of [
    "clavicle-fracture", "shoulder-dislocation", "humeral-shaft-fracture",
    "elbow-dislocation", "forearm-fracture", "distal-radius-fracture",
    "femoral-neck-fracture", "femoral-shaft-fracture", "patella-fracture",
    "tibial-plateau-fracture", "splinting-technique", "position-of-function",
    "hematoma-block", "buck-traction", "skeletal-traction"
  ]) assert.ok(IMMOBILIZATION_GUIDE_ENTRIES.some(item => item.id === id), id);
});

test("every approved note section has valid guide metadata", async () => {
  const source = await readFile(path.join(PROJECT_ROOT, "notes/initial-immobilization-guide.md"), "utf8");
  const note = parseNoteSource({
    source,
    filePath: "notes/initial-immobilization-guide.md",
    categories: ["Orthopedics"]
  });
  const compiled = compileImmobilizationGuide({ note, entries: IMMOBILIZATION_GUIDE_ENTRIES });

  assert.equal(compiled.entries.length, 30);
  assert.deepEqual(
    new Set(compiled.entries.map(entry => entry.headingId)),
    new Set(note.sections.map(section => section.id))
  );
});
