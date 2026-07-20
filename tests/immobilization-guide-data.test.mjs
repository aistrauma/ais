import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { IMMOBILIZATION_GUIDE_ENTRIES } from "../notes/initial-immobilization-guide.data.mjs";
import { compileImmobilizationGuide } from "../scripts/lib/immobilization-guide.mjs";
import { parseNoteSource } from "../scripts/lib/notes.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const APPROVED_DIAGRAM_BY_ID = {
  "clavicle-fracture": "sling",
  "scapula-fracture": "sling",
  "shoulder-dislocation": "sling-swathe",
  "proximal-humerus-fracture": "sling-swathe",
  "humeral-shaft-fracture": "coaptation",
  "distal-humerus-fracture": "posterior-long-arm",
  "olecranon-fracture": "posterior-long-arm",
  "radial-head-fracture": "sling",
  "elbow-dislocation": "posterior-long-arm",
  "terrible-triad-of-the-elbow": "posterior-long-arm",
  "forearm-fracture": "sugar-tong",
  "distal-radius-fracture": "sugar-tong",
  "femoral-neck-fracture": "position-of-comfort",
  "intertrochanteric-fracture": "position-of-comfort",
  "subtrochanteric-fracture": "position-of-comfort",
  "femoral-shaft-fracture": "traction-splint",
  "distal-femur-fracture": "knee-immobilizer",
  "patella-fracture": "knee-immobilizer",
  "tibial-plateau-fracture": "knee-immobilizer",
  "complex-tibial-plateau-or-proximal-tibia-fracture": "long-leg-posterior",
  "general-reduction-principles": "position-of-comfort",
  "pediatric-both-bone-forearm-fractures": "position-of-comfort",
  "splinting-technique": "position-of-comfort",
  "position-of-function": "position-of-function",
  "hematoma-block": "position-of-comfort",
  "intra-articular-shoulder-block": "position-of-comfort",
  "bier-block": "position-of-comfort",
  "buck-traction": "buck-traction",
  "skeletal-traction": "skeletal-traction",
  "traction-splint-contraindications": "traction-splint"
};

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

test("real guide data covers the complete approved content and diagram scope", () => {
  assert.deepEqual([...new Set(IMMOBILIZATION_GUIDE_ENTRIES.map(item => item.section))], [
    "Upper extremity", "Lower extremity", "General principles", "Analgesia", "Traction"
  ]);
  assert.deepEqual(IMMOBILIZATION_GUIDE_ENTRIES.map(item => item.id), Object.keys(APPROVED_DIAGRAM_BY_ID));
  assert.deepEqual(
    Object.fromEntries(IMMOBILIZATION_GUIDE_ENTRIES.map(item => [item.id, item.diagram])),
    APPROVED_DIAGRAM_BY_ID
  );
  assert.deepEqual([...new Set(IMMOBILIZATION_GUIDE_ENTRIES.map(item => item.diagram))], [
    "sling", "sling-swathe", "coaptation", "posterior-long-arm", "sugar-tong",
    "position-of-comfort", "traction-splint", "knee-immobilizer", "long-leg-posterior",
    "position-of-function", "buck-traction", "skeletal-traction"
  ]);
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

test("reviewed safety qualifications remain aligned in note and quick metadata", async () => {
  const source = await readFile(path.join(PROJECT_ROOT, "notes/initial-immobilization-guide.md"), "utf8");
  const byId = Object.fromEntries(IMMOBILIZATION_GUIDE_ENTRIES.map(entry => [entry.id, entry]));
  const pediatricWarning = byId["pediatric-both-bone-forearm-fractures"].warning;
  const tractionText = [
    byId["traction-splint-contraindications"].device,
    ...byId["traction-splint-contraindications"].bullets,
    byId["traction-splint-contraindications"].warning
  ].join(" ");
  const complexTibiaText = [
    ...byId["complex-tibial-plateau-or-proximal-tibia-fracture"].bullets,
    byId["complex-tibial-plateau-or-proximal-tibia-fracture"].warning
  ].join(" ");

  assert.doesNotMatch(source, /avoid forceful reduction unless/i);
  assert.match(source, /avoid repeated or forceful manipulation/i);
  assert.match(source, /vascular compromise or threatened skin requires urgent, gentle realignment under orthopedic or emergency protocol and urgent orthopedic consultation/i);
  assert.match(source, /severe deformity requires urgent specialist direction/i);
  assert.doesNotMatch(complexTibiaText, /avoid forceful reduction unless/i);
  assert.match(complexTibiaText, /avoid repeated or forceful manipulation/i);
  assert.match(complexTibiaText, /vascular compromise or threatened skin.*urgent, gentle realignment.*orthopedic or emergency protocol.*urgent orthopedic consultation/i);
  assert.match(complexTibiaText, /severe deformity.*urgent specialist direction/i);
  for (const trigger of ["high-energy", "unstable", "open", "neurovascularly compromised", "urgent orthopedic evaluation"]) {
    assert.match(complexTibiaText, new RegExp(trigger, "i"), trigger);
  }
  assert.match(source, /potential contraindications or reasons to avoid/i);
  for (const qualifier of ["specific device", "manufacturer instructions", "injury pattern", "orthopedic direction", "local protocol"]) {
    assert.match(source, new RegExp(qualifier, "i"), qualifier);
    assert.match(tractionText, new RegExp(qualifier, "i"), qualifier);
  }

  for (const trigger of [
    "open fracture", "neurovascular injury", "extreme swelling", "compartment syndrome",
    "inability to achieve or maintain reduction", "elbow or wrist dislocation",
    "ipsilateral upper-extremity fracture", "plastic deformation"
  ]) assert.match(pediatricWarning, new RegExp(trigger, "i"), trigger);
  assert.ok(byId["femoral-neck-fracture"].bullets.some(bullet => /according to the clinical scenario and local protocol/i.test(bullet)));

  assert.doesNotMatch(byId["tibial-plateau-fracture"].warning, /escalate immediately/i);
  assert.doesNotMatch(byId["splinting-technique"].warning, /worsening pain|paresthesia|color change|immediate reassessment/i);
});
