# Initial Immobilization Featured Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a source-backed, location-first Initial Immobilization featured guide to the Notes tab, with concise guidance, reusable labeled SVG diagrams, expandable detail, offline support, and a draft GitHub pull request.

**Architecture:** Keep `notes/initial-immobilization-guide.md` as the canonical reviewed prose and source list. Extend the existing Markdown compiler to generate stable H2 section fragments, validate a companion JavaScript metadata module against those sections, and emit `site/generated/immobilization-guide.json`. A dedicated browser controller renders the featured guide independently from standard Notes search, while a separate SVG registry owns diagrams and accessible descriptions.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js 22+, `marked` 18, `sanitize-html`, JSDOM, Node test runner, GitHub Pages service worker.

## Global Constraints

- Preserve the existing Notes routes, Notes search, AIS data, navigation labels, theme mechanism, and static GitHub Pages architecture.
- Do not add an external CDN, runtime API, analytics service, or new production dependency.
- Keep the canonical note in Markdown and generated output under `site/generated/`; never edit generated files manually.
- Use code-native SVG diagrams with deterministic anatomy and device paths; generated bitmap art is out of scope.
- Use existing semantic colors: `--accent` for guidance and a new `--immobilization-warning` token for the immobilizer and cautions.
- All controls are native buttons with visible focus, keyboard parity, and programmatic selected state.
- Hover may provide feedback but cannot be required for content access.
- Respect `prefers-reduced-motion`; animate only opacity and transform.
- At widths below 768 px, stack injury selector, quick guide, diagram, and expanded detail in that order.
- The feature must work at 320 px without horizontal page scrolling.
- Each quick guide contains three to five bullets, a reassessment or escalation warning when applicable, an accessible diagram description, and an Expand full guide control.
- A failed featured-guide request must not disable or hide standard Notes search.
- A stale detail request must never overwrite a newer injury selection.
- Every public clinical claim needs authoritative HTTPS sources and separate clinical review before merge.
- Do not stage, commit, or modify the unrelated `sites-hosted/` directory.

## Source files and responsibilities

- Create `notes/initial-immobilization-guide.md`: canonical reviewed prose, metadata, sources, and H2 injury/topic sections.
- Create `notes/initial-immobilization-guide.data.mjs`: concise UI metadata and diagram mapping only.
- Modify `notes/categories.json`: add the `Orthopedics` category.
- Modify `scripts/lib/notes.mjs`: stable heading IDs and sanitized H2 section extraction.
- Create `scripts/lib/immobilization-guide.mjs`: companion-data validation and generated index assembly.
- Modify `scripts/build-site.mjs`: write guide section fragments and `generated/immobilization-guide.json` before hashing assets.
- Create `site/immobilization-diagrams.js`: reusable SVG registry and accessible fallback.
- Create `site/immobilization-guide.js`: featured-guide state, rendering, loading, retry, selection, and stale-request protection.
- Create `site/immobilization-guide.css`: responsive, theme-aware featured-guide and SVG styling.
- Modify `site/index.html`: guide host plus CSS and module references.
- Modify `docs/notes-authoring.md`: companion-data and clinical diagram review workflow.
- Modify `tests/notes-compiler.test.mjs`: heading and section extraction coverage.
- Modify `tests/build-site.test.mjs`: guide generation, mapping validation, and precache coverage.
- Create `tests/immobilization-guide-data.test.mjs`: metadata schema and coverage tests.
- Create `tests/immobilization-diagrams.test.mjs`: registry, accessibility, and fallback tests.
- Create `tests/immobilization-guide-ui.test.mjs`: controller state, error, keyboard, and stale-request tests.
- Modify `tests/notes-ui.test.mjs`: shell asset and featured-host regression assertions.
- Modify `tests/repository-regression.test.mjs`: source note and guide assets remain present.

---

### Task 1: Generate stable note sections

**Files:**
- Modify: `scripts/lib/notes.mjs:1-105`
- Modify: `tests/notes-compiler.test.mjs:1-66`

**Interfaces:**
- Produces: `slugifyHeading(value: string): string`
- Produces: `extractH2Sections(html: string): Array<{ id: string, title: string, html: string }>`
- Changes: `parseNoteSource(...)` returns a `sections` array in addition to the existing fields.

- [ ] **Step 1: Write failing heading-section tests**

Add tests that require sanitized IDs, stable duplicate suffixes, and section HTML:

```js
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
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `node --test tests/notes-compiler.test.mjs`

Expected: FAIL because headings have no IDs and `note.sections` is undefined.

- [ ] **Step 3: Implement deterministic heading rendering and section extraction**

Import `Renderer`, add IDs to allowed H2-H4 attributes, and extract H2 ranges:

```js
import { marked, Renderer } from "marked";

export function slugifyHeading(value) {
  const slug = textOnly(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "section";
}

function renderMarkdown(markdown) {
  const owners = new Map();
  const renderer = new Renderer();
  renderer.heading = function ({ tokens, depth }) {
    const label = this.parser.parseInline(tokens);
    const base = slugifyHeading(label);
    const count = (owners.get(base) || 0) + 1;
    owners.set(base, count);
    const id = count === 1 ? base : `${base}-${count}`;
    return `<h${depth} id="${id}">${label}</h${depth}>\n`;
  };
  return sanitizeHtml(marked.parse(markdown, { renderer }), {
    allowedTags: ["h2", "h3", "h4", "p", "ul", "ol", "li", "strong", "em", "blockquote", "code", "pre", "table", "thead", "tbody", "tr", "th", "td", "hr", "a"],
    allowedAttributes: { h2: ["id"], h3: ["id"], h4: ["id"], a: ["href", "target", "rel"] },
    allowedSchemes: ["https"],
    transformTags: {
      a: (_tag, attrs) => ({ tagName: "a", attribs: { href: attrs.href || "#", target: "_blank", rel: "noopener noreferrer" } })
    }
  });
}

export function extractH2Sections(html) {
  const matches = [...html.matchAll(/<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g)];
  return matches.map((match, index) => ({
    id: match[1],
    title: textOnly(match[2]),
    html: html.slice(match.index, matches[index + 1]?.index ?? html.length).trim()
  }));
}
```

Add `sections: extractH2Sections(html)` to the `parseNoteSource` return object.

- [ ] **Step 4: Run compiler tests and confirm GREEN**

Run: `node --test tests/notes-compiler.test.mjs`

Expected: all compiler tests PASS.

- [ ] **Step 5: Commit the compiler increment**

```bash
git add scripts/lib/notes.mjs tests/notes-compiler.test.mjs
git commit -m "feat: compile note sections"
```

---

### Task 2: Validate featured-guide metadata and build its index

**Files:**
- Create: `scripts/lib/immobilization-guide.mjs`
- Create: `tests/immobilization-guide-data.test.mjs`
- Modify: `scripts/build-site.mjs:1-63`
- Modify: `tests/build-site.test.mjs:1-107`

**Interfaces:**
- Consumes: `note.sections` from Task 1.
- Produces: `DIAGRAM_IDS: ReadonlySet<string>`
- Produces: `compileImmobilizationGuide({ note, entries }): { version: 1, title: string, lastReviewed: string, sources: Source[], sections: string[], entries: GuideEntry[] }`
- Produces: generated entry fields `detailFragment` and `sourceSlug`.

- [ ] **Step 1: Write failing metadata-validation tests**

Use a minimal note fixture with one section and require complete validation:

```js
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
    note: { title: "Initial Immobilization Guide", slug: "initial-immobilization-guide", lastReviewed: "2026-07-19", sources: [], sections: [{ id: "distal-radius-fracture", html: "<h2>Distal radius fracture</h2>" }] },
    entries: [ENTRY]
  });
  assert.equal(result.version, 1);
  assert.equal(result.entries[0].detailFragment, "generated/notes/initial-immobilization-guide/distal-radius-fracture.html");
});

test("rejects unknown headings, diagrams, duplicate IDs, and short bullet lists", () => {
  assert.throws(() => compileImmobilizationGuide({
    note: { title: "Guide", slug: "initial-immobilization-guide", lastReviewed: "2026-07-19", sources: [], sections: [] },
    entries: [{ ...ENTRY, diagram: "missing", bullets: ["Only one"] }, { ...ENTRY }]
  }), /headingId.*diagram.*bullets.*duplicate/i);
});
```

- [ ] **Step 2: Run the data tests and confirm RED**

Run: `node --test tests/immobilization-guide-data.test.mjs`

Expected: FAIL because the validator module does not exist.

- [ ] **Step 3: Implement the validator with accumulated errors**

Use this complete public shape:

```js
export const DIAGRAM_IDS = new Set([
  "sling", "sling-swathe", "coaptation", "posterior-long-arm",
  "sugar-tong", "volar-wrist", "position-of-function",
  "knee-immobilizer", "long-leg-posterior", "traction-splint",
  "buck-traction", "skeletal-traction", "position-of-comfort"
]);

const TEXT_FIELDS = ["id", "section", "label", "device", "warning", "diagram", "headingId", "diagramAlt"];

export function compileImmobilizationGuide({ note, entries }) {
  const errors = [];
  const headings = new Set(note.sections.map(section => section.id));
  const owners = new Set();
  for (const [index, entry] of entries.entries()) {
    for (const field of TEXT_FIELDS) if (typeof entry[field] !== "string" || !entry[field].trim()) errors.push(`entries[${index}].${field} is required`);
    if (owners.has(entry.id)) errors.push(`duplicate guide id "${entry.id}"`);
    owners.add(entry.id);
    if (!headings.has(entry.headingId)) errors.push(`entries[${index}].headingId does not match a note section`);
    if (!DIAGRAM_IDS.has(entry.diagram)) errors.push(`entries[${index}].diagram is unknown`);
    if (!Array.isArray(entry.bullets) || entry.bullets.length < 3 || entry.bullets.length > 5 || entry.bullets.some(item => typeof item !== "string" || !item.trim())) errors.push(`entries[${index}].bullets must contain 3-5 strings`);
    if (!Array.isArray(entry.searchTerms) || entry.searchTerms.length === 0 || entry.searchTerms.some(item => typeof item !== "string" || !item.trim())) errors.push(`entries[${index}].searchTerms is required`);
  }
  if (errors.length) throw new Error(errors.join("; "));
  return {
    version: 1,
    title: note.title,
    lastReviewed: note.lastReviewed,
    sources: note.sources,
    sections: [...new Set(entries.map(entry => entry.section))],
    entries: entries.map(entry => ({
      ...entry,
      sourceSlug: note.slug,
      detailFragment: `generated/notes/${note.slug}/${entry.headingId}.html`
    }))
  };
}
```

- [ ] **Step 4: Add build support and failing integration assertions**

Import the guide data and validator. When `initial-immobilization-guide` exists, write every `note.sections` fragment, validate entries, then write `generated/immobilization-guide.json`. Add assertions that the guide JSON and section fragment are in `sw-meta.js`.

```js
import { IMMOBILIZATION_GUIDE_ENTRIES } from "../notes/initial-immobilization-guide.data.mjs";
import { compileImmobilizationGuide } from "./lib/immobilization-guide.mjs";

const guideNote = notes.find(note => note.slug === "initial-immobilization-guide");
if (guideNote) {
  const guideIndex = compileImmobilizationGuide({ note: guideNote, entries: IMMOBILIZATION_GUIDE_ENTRIES });
  const sectionDir = path.join(generatedDir, "notes", guideNote.slug);
  await mkdir(sectionDir, { recursive: true });
  for (const section of guideNote.sections) await writeFile(path.join(sectionDir, `${section.id}.html`), section.html);
  await writeFile(path.join(generatedDir, "immobilization-guide.json"), `${JSON.stringify(guideIndex)}\n`);
}
```

In the existing note-fragment loop, exclude `sections` from `notes-index.json` with `const { html, sections, sourceFile, ...note } = compiledNote`.

- [ ] **Step 5: Run build and data tests**

Run: `node --test tests/immobilization-guide-data.test.mjs tests/build-site.test.mjs`

Expected: all focused tests PASS, including precache assertions.

- [ ] **Step 6: Commit the generated-index increment**

```bash
git add scripts/lib/immobilization-guide.mjs scripts/build-site.mjs tests/immobilization-guide-data.test.mjs tests/build-site.test.mjs
git commit -m "feat: build immobilization guide index"
```

---

### Task 3: Author the canonical note and complete metadata

**Files:**
- Create: `notes/initial-immobilization-guide.md`
- Create: `notes/initial-immobilization-guide.data.mjs`
- Modify: `notes/categories.json`
- Test: `tests/immobilization-guide-data.test.mjs`

**Interfaces:**
- Produces: `IMMOBILIZATION_GUIDE_ENTRIES: GuideEntry[]`
- Consumes: the schema and diagram IDs from Task 2.

- [ ] **Step 1: Add failing real-data coverage tests**

Require every approved item, every section, and every reusable diagram family:

```js
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
```

- [ ] **Step 2: Add the category and canonical front matter**

Set `notes/categories.json` to:

```json
["Orthopedics"]
```

Start the note with:

```yaml
---
title: Initial Immobilization Guide
slug: initial-immobilization-guide
category: Orthopedics
tags:
  - fracture reduction
  - splinting
  - dislocation
  - traction
  - orthopedics
summary: Initial reduction, splinting, positioning, and traction principles by injury location.
last_reviewed: 2026-07-19
sources:
  - title: AAFP - Principles of Casting and Splinting
    url: https://www.aafp.org/pubs/afp/issues/2009/0101/p16.html
  - title: AAFP - Splints and Casts, Indications and Methods
    url: https://www.aafp.org/pubs/afp/issues/2009/0901/p491.html
  - title: MSD Manual Professional - How To Apply a Sugar Tong Arm Splint
    url: https://www.msdmanuals.com/professional/injuries-poisoning/how-to-splint-or-immobilize-an-upper-limb/how-to-apply-a-sugar-tong-arm-splint
  - title: Royal Children's Hospital Melbourne - Radius and ulna shaft fractures, emergency department
    url: https://www.rch.org.au/clinicalguide/guideline_index/fractures/radialulna_shaft_diaphysis_fractures_emergency_department/
  - title: Cochrane - Routine traction before surgery in adults with hip fracture
    url: https://www.cochrane.org/evidence/CD000168_routine-use-traction-surgery-adults-hip-fracture
---
```

- [ ] **Step 3: Author the reviewed Markdown body**

Use `/Users/dada/.codex/attachments/c32bb71c-4c52-4d69-ba76-9d518d4e26e1/pasted-text.txt` as the editorial source, but normalize every approved topic into one H2 section. Use the exact H2 labels below so their generated IDs match metadata:

```text
General Reduction Principles
Pediatric Both-Bone Forearm Fractures
Hematoma Block
Intra-Articular Shoulder Block
Bier Block
Splinting Technique
Position of Function
Clavicle Fracture
Scapula Fracture
Shoulder Dislocation
Proximal Humerus Fracture
Humeral Shaft Fracture
Distal Humerus Fracture
Olecranon Fracture
Radial Head Fracture
Elbow Dislocation
Terrible Triad of the Elbow
Forearm Fracture
Distal Radius Fracture
Femoral Neck Fracture
Intertrochanteric Fracture
Subtrochanteric Fracture
Femoral Shaft Fracture
Distal Femur Fracture
Patella Fracture
Tibial Plateau Fracture
Complex Tibial Plateau or Proximal Tibia Fracture
Buck Traction
Skeletal Traction
Traction-Splint Contraindications
```

Apply these verified corrections while transcribing:

- Describe a sugar-tong splint as running from one side of the MCP joints around the elbow to the other side, controlling pronation and supination.
- Keep the wrist near neutral or slight extension rather than flexed after distal-radius reduction.
- Preserve pre- and post-application distal neurovascular documentation.
- Preserve the pediatric prompt-orthopedic-consult criteria for open fracture, neurovascular injury, compartment syndrome, and inability to maintain reduction.
- State that routine preoperative traction is not supported for every hip fracture.
- Keep weights subordinate to orthopedic orders and institutional protocol; do not teach a universal percentage-of-body-weight rule.
- Keep all urgent orthopedic consultation triggers from the source text.

- [ ] **Step 4: Create the complete companion metadata module**

Export one object per H2. The minimum required mapping is:

| Section | Items | Diagram |
| --- | --- | --- |
| Upper extremity | clavicle, scapula | `sling` |
| Upper extremity | shoulder dislocation, proximal humerus | `sling-swathe` |
| Upper extremity | humeral shaft | `coaptation` |
| Upper extremity | distal humerus, olecranon, elbow dislocation, terrible triad | `posterior-long-arm` |
| Upper extremity | radial head | `sling` |
| Upper extremity | forearm, distal radius | `sugar-tong` |
| Lower extremity | femoral neck, intertrochanteric, subtrochanteric | `position-of-comfort` |
| Lower extremity | femoral shaft | `traction-splint` |
| Lower extremity | distal femur, patella, stable tibial plateau | `knee-immobilizer` |
| Lower extremity | complex tibial plateau or proximal tibia | `long-leg-posterior` |
| General principles | reduction, pediatric forearm, splint technique | `position-of-comfort` |
| General principles | position of function | `position-of-function` |
| Analgesia | hematoma, shoulder, Bier blocks | `position-of-comfort` |
| Traction | Buck traction | `buck-traction` |
| Traction | skeletal traction | `skeletal-traction` |
| Traction | traction-splint contraindications | `traction-splint` |

Use this exact entry shape for all objects:

```js
export const IMMOBILIZATION_GUIDE_ENTRIES = [
  {
    id: "distal-radius-fracture",
    section: "Upper extremity",
    label: "Distal radius fracture",
    device: "Sugar-tong splint after reduction",
    bullets: [
      "Use a sugar-tong splint after reduction to control wrist motion and forearm rotation.",
      "Avoid excessive wrist flexion and tight circumferential wrapping.",
      "For a stable nondisplaced fracture, a volar wrist or short-arm splint may be appropriate."
    ],
    warning: "Recheck and document distal pulses, capillary refill, motor function, and sensation after application.",
    diagram: "sugar-tong",
    headingId: "distal-radius-fracture",
    searchTerms: ["wrist", "radius", "Colles", "sugar tong"],
    diagramAlt: "A padded sugar-tong splint runs from the hand around the flexed elbow and returns to the hand, leaving the digits visible."
  }
];
```

For every other entry, reduce the canonical section to three to five action-oriented bullets without adding claims not present in the reviewed note.

- [ ] **Step 5: Run compiler, data, and build tests**

Run: `node --test tests/notes-compiler.test.mjs tests/immobilization-guide-data.test.mjs tests/build-site.test.mjs`

Expected: all tests PASS; build fixture and real data compile without unknown headings or diagrams.

- [ ] **Step 6: Commit the clinical-content increment**

```bash
git add notes/categories.json notes/initial-immobilization-guide.md notes/initial-immobilization-guide.data.mjs tests/immobilization-guide-data.test.mjs
git commit -m "content: add initial immobilization guide"
```

---

### Task 4: Build the reusable clinical diagram registry

**Files:**
- Create: `site/immobilization-diagrams.js`
- Create: `tests/immobilization-diagrams.test.mjs`

**Interfaces:**
- Consumes: the 13 diagram identifiers from Task 2.
- Produces: `DIAGRAMS: Readonly<Record<string, DiagramDefinition>>`
- Produces: `renderImmobilizationDiagram({ id, document, alt }): HTMLElement`

- [ ] **Step 1: Write failing registry and fallback tests**

```js
test("every required diagram renders an accessible SVG", () => {
  const dom = new JSDOM("<!doctype html><body></body>");
  for (const id of DIAGRAM_IDS) {
    const node = renderImmobilizationDiagram({ id, document: dom.window.document, alt: `Description for ${id}` });
    assert.equal(node.querySelector("svg").getAttribute("role"), "img");
    assert.match(node.querySelector("svg").getAttribute("aria-label"), /Description/);
    assert.ok(node.querySelector(".imm-diagram-device"));
  }
});

test("unknown diagrams render a text fallback", () => {
  const dom = new JSDOM("<!doctype html><body></body>");
  const node = renderImmobilizationDiagram({ id: "missing", document: dom.window.document, alt: "Text description" });
  assert.equal(node.querySelector("svg"), null);
  assert.match(node.textContent, /Text description/);
});
```

- [ ] **Step 2: Run diagram tests and confirm RED**

Run: `node --test tests/immobilization-diagrams.test.mjs`

Expected: FAIL because the registry does not exist.

- [ ] **Step 3: Implement the diagram registry and renderer**

Use this exact module boundary and complete starter geometry. The implementation may refine curves during browser review, but it must preserve the device extent and joint position represented here:

```js
const path = (className, d) => `<path class="${className}" d="${d}"/>`;
const diagram = ({ title, limb, padding, device, wrap, labels = "" }) => ({
  title,
  viewBox: "0 0 320 220",
  body: [
    path("imm-diagram-limb", limb),
    path("imm-diagram-padding", padding),
    path("imm-diagram-device", device),
    path("imm-diagram-wrap", wrap),
    labels
  ].join("")
});

export const DIAGRAMS = Object.freeze({
  "sugar-tong": diagram({
    title: "Sugar-tong splint",
    limb: "M72 36Q34 58 55 95L130 171Q145 186 165 181L268 159",
    padding: "M70 31Q26 57 50 100L126 177Q145 194 168 188L274 164",
    device: "M68 27Q21 56 45 104L122 181Q143 201 170 194L279 169",
    wrap: "M43 67L70 58M47 92L78 78M64 119L91 98M84 140L109 118M106 163L130 140M134 183L148 157M167 191L165 163M202 185L197 158M236 178L230 151M269 171L263 144",
    labels: `<g class="imm-diagram-callout"><path d="M51 101L16 130"/><text x="8" y="145">Runs around elbow</text></g><g class="imm-diagram-callout"><path d="M276 169L298 188"/><text x="214" y="206">Digits remain visible</text></g>`
  }),
  "sling": diagram({
    title: "Sling",
    limb: "M105 48L137 104L216 136M137 104L188 83",
    padding: "M94 51L133 113L224 146",
    device: "M82 39L134 122L232 153L187 78Z",
    wrap: "M84 40Q157 2 213 40",
    labels: ""
  }),
  "sling-swathe": diagram({
    title: "Sling and swathe",
    limb: "M105 48L137 104L216 136M137 104L188 83",
    padding: "M94 51L133 113L224 146",
    device: "M82 39L134 122L232 153L187 78ZM58 91Q158 123 257 93",
    wrap: "M61 83Q159 112 254 84M61 99Q159 131 254 101",
    labels: ""
  }),
  "coaptation": diagram({
    title: "Coaptation splint",
    limb: "M157 28L159 175",
    padding: "M139 37L139 178Q158 203 178 178L178 38",
    device: "M133 34L133 182Q158 211 184 182L184 34",
    wrap: "M132 66L184 66M132 98L184 98M132 130L184 130M133 162L183 162",
    labels: ""
  }),
  "posterior-long-arm": diagram({
    title: "Posterior long-arm splint",
    limb: "M95 42L113 121Q117 139 137 143L251 143",
    padding: "M82 43L101 126Q107 151 137 156L254 156",
    device: "M76 44L95 130Q102 160 137 166L257 166",
    wrap: "M84 78L105 73M91 111L112 106M111 146L126 126M152 165L151 143M190 165L189 143M228 165L227 143",
    labels: ""
  }),
  "volar-wrist": diagram({
    title: "Volar wrist splint",
    limb: "M52 116L245 108L286 91",
    padding: "M66 128L250 120",
    device: "M72 136L252 128",
    wrap: "M100 103L105 133M137 101L141 132M174 100L178 131M211 98L215 129",
    labels: ""
  }),
  "position-of-function": diagram({
    title: "Hand position of function",
    limb: "M60 130L171 115L217 73M171 115L229 101M171 115L231 129M171 115L216 157",
    padding: "M151 122Q189 129 226 104",
    device: "M69 148L167 134Q203 144 246 120",
    wrap: "M111 124L116 141M145 119L151 136M181 117L185 137M214 108L219 128",
    labels: `<g class="imm-diagram-callout"><path d="M170 133L154 177"/><text x="107" y="195">MCP joints flexed</text></g>`
  }),
  "knee-immobilizer": diagram({
    title: "Knee immobilizer",
    limb: "M156 22L154 198",
    padding: "M133 58L132 177M177 58L176 177",
    device: "M126 46L125 188M184 46L183 188",
    wrap: "M126 72L184 72M125 104L183 104M125 136L183 136M125 168L183 168",
    labels: ""
  }),
  "long-leg-posterior": diagram({
    title: "Long-leg posterior splint",
    limb: "M151 22L154 176L246 181",
    padding: "M135 30L138 188L251 195",
    device: "M128 34L131 196L255 203",
    wrap: "M130 70L157 70M131 108L158 108M132 146L159 146M143 192L145 175M181 198L183 179M219 201L221 181",
    labels: ""
  }),
  "traction-splint": diagram({
    title: "Traction splint",
    limb: "M61 115L257 115",
    padding: "M60 94L263 94M60 136L263 136",
    device: "M48 82L278 82M48 148L278 148M48 82L48 148M278 82L278 148",
    wrap: "M90 82L90 148M135 82L135 148M180 82L180 148M225 82L225 148",
    labels: `<g class="imm-diagram-callout"><path d="M278 115L307 115"/><text x="249" y="102">Inline traction</text></g>`
  }),
  "buck-traction": diagram({
    title: "Buck traction",
    limb: "M45 94L250 121",
    padding: "M173 102L252 113",
    device: "M171 92L258 105L282 115",
    wrap: "M184 96L180 118M202 99L198 121M220 102L216 123M238 105L234 126",
    labels: `<g class="imm-diagram-callout"><path d="M282 115L309 115"/><text x="251" y="99">Ordered weight</text></g>`
  }),
  "skeletal-traction": diagram({
    title: "Skeletal traction overview",
    limb: "M43 103L245 116",
    padding: "M190 98L190 137",
    device: "M185 82L185 151M174 91L196 91M174 142L196 142M185 116L281 116",
    wrap: "M281 116Q297 116 297 132L297 155",
    labels: `<g class="imm-diagram-callout"><path d="M185 84L153 50"/><text x="97" y="40">Transosseous pin</text></g>`
  }),
  "position-of-comfort": diagram({
    title: "Position of comfort",
    limb: "M63 92Q138 117 257 111",
    padding: "M73 125Q151 143 251 135",
    device: "M58 137Q154 168 266 146L250 177Q151 197 67 166Z",
    wrap: "M99 148Q157 164 225 154",
    labels: `<g class="imm-diagram-callout"><path d="M190 157L224 196"/><text x="157" y="211">Support in comfort</text></g>`
  })
});

export function renderImmobilizationDiagram({ id, document, alt }) {
  const figure = document.createElement("figure");
  figure.className = "imm-diagram";
  const item = DIAGRAMS[id];
  if (!item) {
    const fallback = document.createElement("p");
    fallback.className = "imm-diagram-fallback";
    fallback.textContent = alt;
    figure.append(fallback);
    return figure;
  }
  figure.innerHTML = `<figcaption>${item.title}</figcaption><svg viewBox="${item.viewBox}" role="img" aria-label=""></svg>`;
  const svg = figure.querySelector("svg");
  svg.setAttribute("aria-label", alt);
  svg.innerHTML = item.body;
  return figure;
}
```

Each diagram includes `.imm-diagram-device`, `.imm-diagram-padding`, and `.imm-diagram-wrap`. Use only the classes listed here so CSS controls theme colors. Do not place clinical instructions only inside SVG text.

- [ ] **Step 4: Review each diagram against its canonical note section**

For each identifier, confirm the path, joint position, device extent, and label against the note source. Record review status in the pull-request checklist; do not encode unverified weights or reduction forces in a diagram.

- [ ] **Step 5: Run diagram tests and confirm GREEN**

Run: `node --test tests/immobilization-diagrams.test.mjs`

Expected: all 13 diagram IDs render, all SVGs expose accessible text, and unknown IDs show the text fallback.

- [ ] **Step 6: Commit the diagram increment**

```bash
git add site/immobilization-diagrams.js tests/immobilization-diagrams.test.mjs
git commit -m "feat: add immobilization diagrams"
```

---

### Task 5: Implement the featured-guide controller

**Files:**
- Create: `site/immobilization-guide.js`
- Create: `tests/immobilization-guide-ui.test.mjs`

**Interfaces:**
- Consumes: `renderImmobilizationDiagram(...)` from Task 4.
- Produces: `createImmobilizationGuide({ root, fetchImpl, indexUrl }): { load, destroy }`

- [ ] **Step 1: Create the JSDOM fixture and failing happy-path test**

```js
function installGuideDom() {
  const dom = new JSDOM(`<!doctype html><body><section id="immobilizationGuide">
    <div data-guide-loading></div><div data-guide-error></div><div data-guide-content></div>
  </section></body>`, { url: "https://example.test/#notes" });
  return dom;
}

test("selecting an injury updates bullets and diagram together", async () => {
  const dom = installGuideDom();
  const app = createImmobilizationGuide({
    root: dom.window.document.querySelector("#immobilizationGuide"),
    fetchImpl: async () => response(GUIDE_FIXTURE)
  });
  await app.load();
  [...dom.window.document.querySelectorAll("[data-guide-entry]")].find(button => button.textContent.includes("Distal radius")).click();
  assert.match(dom.window.document.querySelector("[data-guide-quick]").textContent, /sugar-tong/i);
  assert.equal(dom.window.document.querySelector(".imm-diagram svg").getAttribute("aria-label"), GUIDE_FIXTURE.entries[1].diagramAlt);
});
```

- [ ] **Step 2: Add failing error, retry, expansion, stale-response, and focus tests**

Require:

- index failure shows Retry while standard Notes remains outside the controller;
- section buttons expose `aria-pressed`;
- selected injury exposes `aria-current="true"`;
- activated injury keeps focus after rerender;
- Expand fetches only `detailFragment`;
- expanded detail renders `payload.sources` as HTTPS links with `target="_blank"` and `rel="noopener noreferrer"`;
- Collapse preserves selection;
- changing injury invalidates the old detail request;
- fragment failure keeps quick bullets and diagram visible.

- [ ] **Step 3: Run UI tests and confirm RED**

Run: `node --test tests/immobilization-guide-ui.test.mjs`

Expected: FAIL because the controller does not exist.

- [ ] **Step 4: Implement state and safe DOM rendering**

Use this controller state and token discipline:

```js
export function createImmobilizationGuide({ root, fetchImpl = fetch, indexUrl = "generated/immobilization-guide.json" }) {
  let payload = null;
  let section = "";
  let selectedId = "";
  let expanded = false;
  let detailToken = 0;
  let destroyed = false;

  const activeEntry = () => payload?.entries.find(entry => entry.id === selectedId);

  const make = (tag, className, text) => {
    const node = root.ownerDocument.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  function renderLoading() {
    const skeleton = make("div", "imm-loading-skeleton");
    skeleton.setAttribute("aria-label", "Loading Initial Immobilization Guide");
    skeleton.innerHTML = `<span></span><span></span><span></span>`;
    root.replaceChildren(skeleton);
  }

  function renderLoadError() {
    const message = make("p", "imm-error", "The Initial Immobilization Guide could not load.");
    const retry = make("button", "tbtn", "Retry");
    retry.type = "button";
    retry.addEventListener("click", load, { once: true });
    root.replaceChildren(message, retry);
  }

  function renderDetailError(entry) {
    const detail = root.querySelector("[data-guide-detail]");
    const message = make("p", "imm-error", "The full guide section could not load.");
    const retry = make("button", "tbtn", "Retry section");
    retry.type = "button";
    retry.addEventListener("click", () => void showDetail(entry, ++detailToken), { once: true });
    detail.replaceChildren(message, retry);
  }

  function renderSources(container) {
    const heading = make("h4", "", "Sources");
    const list = make("ul");
    for (const source of payload.sources) {
      const item = make("li");
      const link = make("a", "", source.title);
      link.href = source.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      item.append(link);
      list.append(item);
    }
    container.append(heading, list);
  }

  async function showDetail(entry, token) {
    try {
      const response = await fetchImpl(entry.detailFragment);
      if (!response.ok) throw new Error(`Detail request failed (${response.status})`);
      const html = await response.text();
      if (destroyed || token !== detailToken || activeEntry()?.id !== entry.id) return;
      const detail = root.querySelector("[data-guide-detail]");
      detail.innerHTML = html;
      renderSources(detail);
      detail.append(make("p", "note-disclaimer", "Educational quick reference only. Verify against current guidance and local protocols."));
    } catch {
      if (destroyed || token !== detailToken || activeEntry()?.id !== entry.id) return;
      renderDetailError(entry);
    }
  }

  function selectEntry(id, restoreFocus = false) {
    selectedId = id;
    expanded = false;
    detailToken += 1;
    render();
    if (restoreFocus) root.querySelector(`[data-guide-entry="${CSS.escape(id)}"]`)?.focus();
  }

  async function load() {
    renderLoading();
    try {
      const response = await fetchImpl(indexUrl);
      if (!response.ok) throw new Error(`Guide request failed (${response.status})`);
      const next = await response.json();
      if (next.version !== 1 || !Array.isArray(next.entries) || next.entries.length === 0) throw new Error("Unsupported guide index");
      payload = next;
      section = next.sections[0];
      selectedId = next.entries.find(entry => entry.section === section).id;
      render();
    } catch {
      renderLoadError();
    }
  }

  return { load, destroy() { destroyed = true; detailToken += 1; root.replaceChildren(); } };
}
```

Implement `render()` as four focused private builders: `renderSectionButtons()`, `renderEntryButtons()`, `renderQuickGuide()`, and `renderExpandedDetail()`. Each builder receives the current state, returns a DOM node, and uses `make()` plus `textContent` for metadata. `renderQuickGuide()` appends `renderImmobilizationDiagram({ id: entry.diagram, document: root.ownerDocument, alt: entry.diagramAlt })`. `renderExpandedDetail()` creates `[data-guide-detail]` and calls `showDetail(entry, ++detailToken)`; `showDetail()` calls `renderSources(detail)` and appends the educational disclaimer after the sanitized fragment loads. Only the generated detail fragment and the fixed loading-skeleton markup may use `innerHTML`.

- [ ] **Step 5: Auto-initialize only when the host exists**

```js
if (typeof document !== "undefined") {
  const root = document.querySelector("#immobilizationGuide");
  if (root) void createImmobilizationGuide({ root }).load();
}
```

- [ ] **Step 6: Run controller tests and confirm GREEN**

Run: `node --test tests/immobilization-guide-ui.test.mjs`

Expected: all controller tests PASS.

- [ ] **Step 7: Commit the controller increment**

```bash
git add site/immobilization-guide.js tests/immobilization-guide-ui.test.mjs
git commit -m "feat: add immobilization guide controller"
```

---

### Task 6: Integrate and style the featured guide

**Files:**
- Create: `site/immobilization-guide.css`
- Modify: `site/index.html:1037-1038,1369-1385,1914-1915`
- Modify: `tests/notes-ui.test.mjs:328-341`

**Interfaces:**
- Consumes: the controller and diagram classes from Tasks 4-5.
- Produces: `#immobilizationGuide` host and responsive visual system.

- [ ] **Step 1: Add failing shell-asset assertions**

```js
assert.match(html, /<link rel="stylesheet" href="immobilization-guide\.css">/);
assert.match(html, /<section id="immobilizationGuide"/);
assert.match(html, /<script type="module" src="immobilization-guide\.js"><\/script>/);
assert.match(css, /\.imm-workbench/);
assert.match(css, /@media\(max-width:767px\)/);
```

- [ ] **Step 2: Run the shell regression and confirm RED**

Run: `node --test tests/notes-ui.test.mjs`

Expected: FAIL because the host and assets are absent.

- [ ] **Step 3: Add the host before Notes search**

Insert inside `#notesLanding`, before the search label:

```html
<section id="immobilizationGuide" class="imm-feature" aria-labelledby="immobilizationTitle">
  <div data-guide-loading class="imm-loading" aria-live="polite">Loading Initial Immobilization Guide…</div>
  <div data-guide-error class="imm-error" aria-live="polite"></div>
  <div data-guide-content></div>
</section>
```

Add `immobilization-guide.css` after `notes.css`, and add the module script before `notes.js`.

- [ ] **Step 4: Implement the approved visual system**

Define semantic tokens in the new stylesheet:

```css
.imm-feature{--immobilization-warning:#d56f48;margin:0 0 26px}
.imm-loading-skeleton{display:grid;grid-template-columns:minmax(170px,210px) minmax(260px,.9fr) minmax(330px,1.15fr);gap:14px;padding:20px;border-radius:22px;background:color-mix(in srgb,var(--ink) 7%,var(--bg))}
.imm-loading-skeleton span{display:block;min-height:240px;border-radius:14px;background:color-mix(in srgb,var(--panel) 88%,var(--line));animation:imm-pulse 1.4s cubic-bezier(.16,1,.3,1) infinite alternate}
@keyframes imm-pulse{from{opacity:.55}to{opacity:1}}
.imm-shell{padding:6px;border-radius:22px;background:color-mix(in srgb,var(--ink) 7%,var(--bg));box-shadow:0 24px 64px color-mix(in srgb,var(--navy) 13%,transparent)}
.imm-core{overflow:hidden;border-radius:16px;background:var(--bg)}
.imm-workbench{display:grid;grid-template-columns:minmax(170px,210px) minmax(260px,.9fr) minmax(330px,1.15fr);gap:14px;padding:14px}
.imm-panel{background:var(--panel);border-radius:14px;box-shadow:inset 0 1px 0 color-mix(in srgb,var(--panel) 78%,white)}
.imm-section,.imm-entry,.imm-expand{font:inherit;cursor:pointer}
.imm-section:focus-visible,.imm-entry:focus-visible,.imm-expand:focus-visible{outline:3px solid color-mix(in srgb,var(--accent) 55%,transparent);outline-offset:2px}
.imm-entry[aria-current="true"]{background:color-mix(in srgb,var(--accent) 12%,var(--panel));color:var(--accent);font-weight:800}
.imm-warning{border-left:3px solid var(--immobilization-warning);background:color-mix(in srgb,var(--immobilization-warning) 10%,var(--panel))}
.imm-diagram-limb{fill:color-mix(in srgb,var(--panel) 80%,var(--muted));stroke:var(--muted)}
.imm-diagram-padding{fill:none;stroke:color-mix(in srgb,var(--immobilization-warning) 40%,white)}
.imm-diagram-device{fill:none;stroke:var(--immobilization-warning)}
.imm-diagram-wrap{fill:none;stroke:color-mix(in srgb,var(--panel) 75%,white)}
.imm-diagram-callout{fill:var(--accent);stroke:var(--accent)}
@media(max-width:767px){.imm-workbench,.imm-loading-skeleton{grid-template-columns:1fr}.imm-loading-skeleton span{min-height:120px}.imm-selector{order:1}.imm-quick{order:2}.imm-visual{order:3}.imm-detail{order:4}}
@media(prefers-reduced-motion:reduce){.imm-feature *{animation:none!important;scroll-behavior:auto!important;transition-duration:.01ms!important}}
```

Use 12-16 px card radii consistently, full-pill section controls, and only the existing teal plus warning orange. Do not add glass blur, decorative motion, or a new font.

- [ ] **Step 5: Run shell and controller tests**

Run: `node --test tests/notes-ui.test.mjs tests/immobilization-guide-ui.test.mjs tests/immobilization-diagrams.test.mjs`

Expected: all tests PASS.

- [ ] **Step 6: Commit the integrated UI**

```bash
git add site/index.html site/immobilization-guide.css tests/notes-ui.test.mjs
git commit -m "feat: feature immobilization guide in notes"
```

---

### Task 7: Document, validate, and review the complete feature

**Files:**
- Modify: `docs/notes-authoring.md`
- Modify: `tests/repository-regression.test.mjs`
- Generated by build, not committed: `site/generated/**`

**Interfaces:**
- Verifies all prior task outputs together.

- [ ] **Step 1: Add repository regression assertions**

```js
test("keeps the featured immobilization guide source and assets", async () => {
  for (const path of [
    "notes/initial-immobilization-guide.md",
    "notes/initial-immobilization-guide.data.mjs",
    "site/immobilization-guide.js",
    "site/immobilization-guide.css",
    "site/immobilization-diagrams.js"
  ]) assert.equal(await missing(path), false, path);
});
```

- [ ] **Step 2: Document the companion-data workflow**

Add a section to `docs/notes-authoring.md` stating:

```markdown
## Interactive featured guides

The Initial Immobilization Guide keeps reviewed prose and sources in `notes/initial-immobilization-guide.md`. Its companion file, `notes/initial-immobilization-guide.data.mjs`, contains only UI summaries, section grouping, search terms, accessible diagram descriptions, and diagram IDs.

Every companion `headingId` must match an H2 in the Markdown note. `npm run build` validates the mapping and rejects unknown headings or diagrams. Clinical review must cover both the prose and the diagram path, positioning, and labels before merge.
```

- [ ] **Step 3: Run the full check**

Run: `npm run check`

Expected: all Node tests PASS; output reports `Built 1 notes`; generated Notes index, guide index, section fragments, and service-worker metadata are created.

- [ ] **Step 4: Inspect generated output without committing it**

Run: `git status -sb`

Expected: `site/generated/` remains ignored; only intended source, tests, and docs are tracked. `sites-hosted/` remains untracked and untouched.

- [ ] **Step 5: Preview and verify desktop, keyboard, dark mode, and mobile**

Run: `python3 -m http.server 8742 --directory site`

Verify in a real browser:

- open `http://localhost:8742/#notes`;
- select one injury from each section;
- expand and collapse distal radius and femoral shaft details;
- navigate all section and injury controls with keyboard only;
- toggle Night mode and verify line, padding, device, warning, and callout contrast;
- emulate widths 320, 390, 768, and desktop with device metrics;
- disable network after initial load and confirm guide index, diagrams, and expanded detail remain available from the service worker;
- confirm no horizontal page scrolling and no focus loss after selection.

- [ ] **Step 6: Run a clinical diagram checklist**

For each of the 13 diagram IDs, confirm:

- device extent and path;
- joint position;
- visible distal digits where applicable;
- pressure-point padding callouts;
- absence of unverified traction weight or reduction-force instructions;
- accessible description matches the visual.

Do not mark the pull request ready for merge until a separate clinician confirms this checklist.

- [ ] **Step 7: Commit documentation and final fixes**

```bash
git add docs/notes-authoring.md tests/repository-regression.test.mjs
git commit -m "docs: add featured guide review workflow"
```

---

### Task 8: Push the branch and open the draft pull request

**Files:**
- No additional source files unless final validation finds a defect.

**Interfaces:**
- Produces: pushed branch `agent/initial-immobilization-guide` and a draft PR against `main`.

- [ ] **Step 1: Confirm GitHub tooling and scope**

Run:

```bash
gh --version
gh auth status
git status -sb
git diff --stat origin/main...HEAD
```

Expected: `gh` is installed and authenticated as `aistrauma`; only approved guide source, tests, docs, and the already-approved design/plan commits appear. `sites-hosted/` is not staged.

- [ ] **Step 2: Push the branch**

Run: `git push -u origin agent/initial-immobilization-guide`

Expected: branch is created on `aistrauma/ais` and tracks origin.

- [ ] **Step 3: Open a draft pull request**

Use title: `Add featured initial immobilization guide`

Use a body containing:

```markdown
## What changed

- adds a location-first Initial Immobilization Guide above Notes search
- provides concise guidance, reusable labeled SVG diagrams, and expandable reviewed sections
- extends the Notes build for validated section fragments and offline precaching
- adds compiler, UI, accessibility, error-state, and regression coverage

## Validation

- `npm run check`
- desktop, keyboard, dark-mode, reduced-motion, 320 px, 390 px, and 768 px browser checks
- offline guide and expanded-section check

## Merge gate

- [ ] Separate clinical review of all prose
- [ ] Separate clinical review of all 13 diagram paths, positions, and labels
- [ ] Confirm `last_reviewed` matches the completed clinical review date
```

- [ ] **Step 4: Verify pull-request checks**

Run: `gh pr checks --watch`

Expected: validation passes. Do not merge the draft PR in this task.

- [ ] **Step 5: Report the handoff**

Report branch, commit range, PR URL, `npm run check` result, browser matrix result, and the outstanding clinical-review gate.
