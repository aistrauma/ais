import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { initTqipAccordions } from "../site/tqip-accordions.js";

function installDom() {
  const dom = new JSDOM(`<!doctype html><body>
    <div id="viewTQIP">
      <div class="tqip-controls" aria-label="TQIP section controls">
        <button id="tqipExpandAll">Expand all</button>
        <button id="tqipCollapseAll">Collapse all</button>
        <span id="tqipState" aria-live="polite"></span>
      </div>
      <details class="card" open><summary>First section</summary><p>First rule</p></details>
      <details class="card"><summary>Second section</summary><p>Second rule</p></details>
    </div>
  </body>`, { url: "https://example.test/" });
  return dom;
}

test("initializes collapsed sections and persists bulk changes", t => {
  const dom = installDom();
  t.after(() => dom.window.close());
  const { document, sessionStorage } = dom.window;
  const api = initTqipAccordions(document.querySelector("#viewTQIP"), sessionStorage);
  const details = [...document.querySelectorAll("details")];
  const summary = document.querySelector("summary");

  assert.ok(details.every(item => !item.open));
  assert.ok(document.getElementById(summary.getAttribute("aria-controls")));
  assert.equal(summary.getAttribute("aria-expanded"), "false");

  api.expandAll();
  assert.ok(details.every(item => item.open));
  assert.equal(summary.getAttribute("aria-expanded"), "true");
  assert.deepEqual(JSON.parse(sessionStorage.getItem("aisTqipOpenSections")), ["first-section", "second-section"]);

  api.collapseAll();
  assert.ok(details.every(item => !item.open));
  api.destroy();
});

test("persists native toggle changes and restores them on the next initialization", t => {
  const dom = installDom();
  t.after(() => dom.window.close());
  const { document, sessionStorage } = dom.window;
  const root = document.querySelector("#viewTQIP");
  const first = document.querySelector("details");
  const firstApi = initTqipAccordions(root, sessionStorage);

  first.open = true;
  first.dispatchEvent(new dom.window.Event("toggle"));
  assert.deepEqual(JSON.parse(sessionStorage.getItem("aisTqipOpenSections")), ["first-section"]);
  firstApi.destroy();

  const secondApi = initTqipAccordions(root, sessionStorage);
  assert.equal(first.open, true);
  assert.equal(document.querySelector("details:nth-of-type(2)").open, false);
  assert.equal(first.querySelector("summary").getAttribute("aria-expanded"), "true");
  secondApi.destroy();
});

test("destroy removes section and control listeners", t => {
  const dom = installDom();
  t.after(() => dom.window.close());
  const { document, sessionStorage } = dom.window;
  const api = initTqipAccordions(document.querySelector("#viewTQIP"), sessionStorage);
  api.destroy();

  document.querySelector("#tqipExpandAll").click();
  assert.ok([...document.querySelectorAll("details")].every(item => !item.open));
});

test("keeps collapsed TQIP rows compact without shrinking the tap target", async () => {
  const css = await readFile(new URL("../site/tqip-accordions.css", import.meta.url), "utf8");

  assert.match(css, /#viewTQIP details\.card\s*{[^}]*padding:\s*0 16px;/s);
  assert.match(css, /#viewTQIP details > summary\s*{[^}]*min-height:\s*44px;/s);
  assert.match(css, /#viewTQIP \.tqip-section-content\s*{[^}]*padding-bottom:\s*14px;/s);
});
