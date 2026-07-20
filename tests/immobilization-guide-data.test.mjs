import test from "node:test";
import assert from "node:assert/strict";
import { compileImmobilizationGuide } from "../scripts/lib/immobilization-guide.mjs";

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
