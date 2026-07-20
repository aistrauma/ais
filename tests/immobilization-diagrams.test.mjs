import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { DIAGRAM_IDS } from "../scripts/lib/immobilization-guide.mjs";
import {
  DIAGRAMS,
  renderImmobilizationDiagram
} from "../site/immobilization-diagrams.js";

test("registry covers every approved diagram and cannot be extended", () => {
  assert.deepEqual(new Set(Object.keys(DIAGRAMS)), DIAGRAM_IDS);
  assert.equal(Object.isFrozen(DIAGRAMS), true);
});

test("every required diagram renders an accessible SVG", () => {
  const dom = new JSDOM("<!doctype html><body></body>");

  for (const id of DIAGRAM_IDS) {
    const alt = `Description for ${id}`;
    const node = renderImmobilizationDiagram({
      id,
      document: dom.window.document,
      alt
    });
    const svg = node.querySelector("svg");

    assert.equal(node.tagName, "FIGURE", id);
    assert.equal(svg?.getAttribute("role"), "img", id);
    assert.equal(svg?.getAttribute("aria-label"), alt, id);
    assert.ok(node.querySelector("figcaption")?.textContent.trim(), id);
    assert.ok(node.querySelector(".imm-diagram-limb"), id);
    assert.ok(node.querySelector(".imm-diagram-padding"), id);
    assert.ok(node.querySelector(".imm-diagram-device"), id);
    assert.ok(node.querySelector(".imm-diagram-wrap"), id);
  }
});

test("unknown diagrams render the supplied text fallback", () => {
  const dom = new JSDOM("<!doctype html><body></body>");

  for (const id of ["missing", "toString"]) {
    const node = renderImmobilizationDiagram({
      id,
      document: dom.window.document,
      alt: "Text description"
    });

    assert.equal(node.querySelector("svg"), null, id);
    assert.equal(node.querySelector(".imm-diagram-fallback")?.textContent, "Text description", id);
  }
});
