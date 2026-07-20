import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { createImmobilizationGuide } from "../site/immobilization-guide.js";

const GUIDE_FIXTURE = {
  version: 1,
  title: "Initial Immobilization Guide",
  lastReviewed: "2026-07-19",
  sources: [
    { title: "AAFP guidance", url: "https://www.aafp.org/example" }
  ],
  sections: ["Upper extremity", "Lower extremity"],
  entries: [
    {
      id: "clavicle-fracture",
      section: "Upper extremity",
      label: "Clavicle fracture",
      device: "Sling for comfort",
      bullets: ["Support the arm in a sling.", "Recheck distal neurovascular status."],
      warning: "Escalate threatened skin or neurovascular compromise.",
      diagram: "sling",
      diagramAlt: "An arm supported in a sling.",
      detailFragment: "generated/notes/initial-immobilization-guide/clavicle-fracture.html"
    },
    {
      id: "distal-radius-fracture",
      section: "Upper extremity",
      label: "Distal radius fracture",
      device: "Sugar-tong splint after reduction",
      bullets: ["Apply a sugar-tong splint.", "Keep digits visible."],
      warning: "Recheck distal neurovascular status.",
      diagram: "sugar-tong",
      diagramAlt: "A padded sugar-tong splint around the elbow.",
      detailFragment: "generated/notes/initial-immobilization-guide/distal-radius-fracture.html"
    },
    {
      id: "patella-fracture",
      section: "Lower extremity",
      label: "Patella fracture",
      device: "Knee immobilizer in extension",
      bullets: ["Immobilize the knee in extension."],
      warning: "Assess the extensor mechanism.",
      diagram: "knee-immobilizer",
      diagramAlt: "A knee immobilizer supports the leg.",
      detailFragment: "generated/notes/initial-immobilization-guide/patella-fracture.html"
    }
  ]
};

const response = (payload, { ok = true, status = 200 } = {}) => ({
  ok,
  status,
  json: async () => payload,
  text: async () => String(payload)
});

const tick = () => new Promise(resolve => setTimeout(resolve, 0));

const deferred = () => {
  let resolve;
  return {
    promise: new Promise(done => { resolve = done; }),
    resolve
  };
};

function installGuideDom() {
  return new JSDOM(`<!doctype html><body><section id="immobilizationGuide"></section></body>`, {
    url: "https://example.test/#notes"
  });
}

test("selecting an injury updates bullets and diagram together", async () => {
  const dom = installGuideDom();
  const root = dom.window.document.querySelector("#immobilizationGuide");
  const app = createImmobilizationGuide({
    root,
    fetchImpl: async () => response(GUIDE_FIXTURE)
  });

  await app.load();
  [...root.querySelectorAll("[data-guide-entry]")]
    .find(button => button.textContent.includes("Distal radius"))
    .click();

  assert.match(root.querySelector("[data-guide-quick]").textContent, /sugar-tong/i);
  assert.equal(
    root.querySelector(".imm-diagram svg").getAttribute("aria-label"),
    GUIDE_FIXTURE.entries[1].diagramAlt
  );

  app.destroy();
  dom.window.close();
});

test("quick guidance precedes the diagram in accessible DOM order", async () => {
  const dom = installGuideDom();
  const root = dom.window.document.querySelector("#immobilizationGuide");
  const app = createImmobilizationGuide({ root, fetchImpl: async () => response(GUIDE_FIXTURE) });

  await app.load();

  const quick = root.querySelector("[data-guide-quick]");
  const order = [...quick.children].map(node => node.className || node.tagName);
  assert.deepEqual(order, [
    "H3",
    "imm-guide-device",
    "imm-guide-actions",
    "imm-guide-warning",
    "note-disclaimer",
    "imm-expand",
    "imm-diagram"
  ]);

  app.destroy();
  dom.window.close();
});

test("renders section and injury controls in source order with accessible selection state", async () => {
  const dom = installGuideDom();
  const root = dom.window.document.querySelector("#immobilizationGuide");
  const app = createImmobilizationGuide({ root, fetchImpl: async () => response(GUIDE_FIXTURE) });

  await app.load();

  const sections = [...root.querySelectorAll("[data-guide-section]")];
  assert.deepEqual(sections.map(button => button.textContent), GUIDE_FIXTURE.sections);
  assert.deepEqual(sections.map(button => button.getAttribute("aria-pressed")), ["true", "false"]);
  assert.ok(sections.every(button => button.tagName === "BUTTON" && button.type === "button"));
  assert.deepEqual(
    [...root.querySelectorAll("[data-guide-entry]")].map(button => button.dataset.guideEntry),
    ["clavicle-fracture", "distal-radius-fracture"]
  );
  assert.equal(root.querySelector('[data-guide-entry="clavicle-fracture"]').getAttribute("aria-current"), "true");

  sections[1].click();
  assert.deepEqual(
    [...root.querySelectorAll("[data-guide-entry]")].map(button => button.dataset.guideEntry),
    ["patella-fracture"]
  );
  assert.equal(root.querySelector('[data-guide-entry="patella-fracture"]').getAttribute("aria-current"), "true");
  assert.match(root.querySelector("[data-guide-quick]").textContent, /knee immobilizer/i);

  app.destroy();
  dom.window.close();
});

test("activated injury keeps focus after rerender", async () => {
  const dom = installGuideDom();
  const root = dom.window.document.querySelector("#immobilizationGuide");
  const app = createImmobilizationGuide({ root, fetchImpl: async () => response(GUIDE_FIXTURE) });
  await app.load();

  const button = root.querySelector('[data-guide-entry="distal-radius-fracture"]');
  button.focus();
  button.click();

  assert.equal(dom.window.document.activeElement, root.querySelector('[data-guide-entry="distal-radius-fracture"]'));
  assert.equal(dom.window.document.activeElement.getAttribute("aria-current"), "true");

  app.destroy();
  dom.window.close();
});

test("section and expansion controls keep focus across rerenders", async () => {
  const dom = installGuideDom();
  const root = dom.window.document.querySelector("#immobilizationGuide");
  const app = createImmobilizationGuide({
    root,
    fetchImpl: async url => url.includes("immobilization-guide.json")
      ? response(GUIDE_FIXTURE)
      : response("<p>Full detail</p>")
  });
  await app.load();

  const section = root.querySelector('[data-guide-section="Lower extremity"]');
  section.focus();
  section.click();
  assert.equal(dom.window.document.activeElement, root.querySelector('[data-guide-section="Lower extremity"]'));

  const expand = root.querySelector("[data-guide-expand]");
  expand.focus();
  expand.click();
  assert.equal(dom.window.document.activeElement, root.querySelector("[data-guide-collapse]"));

  root.querySelector("[data-guide-collapse]").click();
  assert.equal(dom.window.document.activeElement, root.querySelector("[data-guide-expand]"));

  app.destroy();
  dom.window.close();
});

test("index failure shows Retry without changing standard Notes", async () => {
  const dom = installGuideDom();
  const document = dom.window.document;
  const standardNotes = document.createElement("section");
  standardNotes.id = "notesApp";
  standardNotes.textContent = "Standard Notes remain available";
  document.body.append(standardNotes);
  const root = document.querySelector("#immobilizationGuide");
  let attempt = 0;
  const app = createImmobilizationGuide({
    root,
    fetchImpl: async () => {
      attempt += 1;
      if (attempt === 1) throw new Error("offline");
      return response(GUIDE_FIXTURE);
    }
  });

  await app.load();
  assert.match(root.textContent, /could not load/i);
  assert.match(standardNotes.textContent, /remain available/i);
  root.querySelector("button").click();
  await tick();
  assert.ok(root.querySelector("[data-guide-quick]"));
  assert.match(standardNotes.textContent, /remain available/i);

  app.destroy();
  dom.window.close();
});

test("empty or unsupported indexes render the compact load error", async () => {
  for (const invalid of [
    { version: 2, sections: ["Upper extremity"], entries: GUIDE_FIXTURE.entries },
    { version: 1, sections: [], entries: [] }
  ]) {
    const dom = installGuideDom();
    const root = dom.window.document.querySelector("#immobilizationGuide");
    const app = createImmobilizationGuide({ root, fetchImpl: async () => response(invalid) });
    await app.load();
    assert.match(root.textContent, /could not load/i);
    assert.equal(root.querySelector("[data-guide-quick]"), null);
    app.destroy();
    dom.window.close();
  }
});

test("Expand fetches only the selected fragment and renders sources and disclaimer", async () => {
  const dom = installGuideDom();
  const root = dom.window.document.querySelector("#immobilizationGuide");
  const calls = [];
  const app = createImmobilizationGuide({
    root,
    indexUrl: "/guide-index.json",
    fetchImpl: async url => {
      calls.push(url);
      return url === "/guide-index.json"
        ? response(GUIDE_FIXTURE)
        : response("<h2>Clavicle fracture</h2><p>Reviewed detail.</p>");
    }
  });

  await app.load();
  assert.deepEqual(calls, ["/guide-index.json"]);
  root.querySelector("[data-guide-expand]").click();
  await tick();

  assert.deepEqual(calls, ["/guide-index.json", GUIDE_FIXTURE.entries[0].detailFragment]);
  assert.match(root.querySelector("[data-guide-detail]").textContent, /Reviewed detail/);
  const source = root.querySelector("[data-guide-detail] a");
  assert.equal(source.href, GUIDE_FIXTURE.sources[0].url);
  assert.equal(source.protocol, "https:");
  assert.equal(source.target, "_blank");
  assert.equal(source.rel, "noopener noreferrer");
  assert.match(root.textContent, /Educational quick reference only/i);
  assert.equal(root.querySelectorAll(".note-disclaimer").length, 1);

  app.destroy();
  dom.window.close();
});

test("Collapse preserves the selected injury", async () => {
  const dom = installGuideDom();
  const root = dom.window.document.querySelector("#immobilizationGuide");
  const app = createImmobilizationGuide({
    root,
    fetchImpl: async url => url.includes("immobilization-guide.json")
      ? response(GUIDE_FIXTURE)
      : response("<p>Full detail</p>")
  });
  await app.load();
  root.querySelector('[data-guide-entry="distal-radius-fracture"]').click();
  root.querySelector("[data-guide-expand]").click();
  await tick();

  root.querySelector("[data-guide-collapse]").click();

  assert.equal(root.querySelector('[data-guide-entry="distal-radius-fracture"]').getAttribute("aria-current"), "true");
  assert.equal(root.querySelector("[data-guide-detail]"), null);
  assert.match(root.querySelector("[data-guide-quick]").textContent, /sugar-tong/i);

  app.destroy();
  dom.window.close();
});

test("changing injury invalidates an old detail response", async () => {
  const dom = installGuideDom();
  const root = dom.window.document.querySelector("#immobilizationGuide");
  const oldDetail = deferred();
  const app = createImmobilizationGuide({
    root,
    fetchImpl: async url => {
      if (url.includes("immobilization-guide.json")) return response(GUIDE_FIXTURE);
      if (url.includes("clavicle-fracture")) return oldDetail.promise;
      return response("<p id=latest>Latest injury detail</p>");
    }
  });
  await app.load();
  root.querySelector("[data-guide-expand]").click();
  root.querySelector('[data-guide-entry="distal-radius-fracture"]').click();
  root.querySelector("[data-guide-expand]").click();
  await tick();

  oldDetail.resolve(response("<p id=stale>Stale clavicle detail</p>"));
  await tick();

  assert.ok(root.querySelector("#latest"));
  assert.equal(root.querySelector("#stale"), null);
  assert.equal(root.querySelector('[data-guide-entry="distal-radius-fracture"]').getAttribute("aria-current"), "true");

  app.destroy();
  dom.window.close();
});

test("fragment failure keeps the quick guide and diagram visible with inline retry", async () => {
  const dom = installGuideDom();
  const root = dom.window.document.querySelector("#immobilizationGuide");
  const app = createImmobilizationGuide({
    root,
    fetchImpl: async url => url.includes("immobilization-guide.json")
      ? response(GUIDE_FIXTURE)
      : response("failed", { ok: false, status: 503 })
  });
  await app.load();
  root.querySelector("[data-guide-expand]").click();
  await tick();

  assert.ok(root.querySelector("[data-guide-quick]"));
  assert.ok(root.querySelector(".imm-diagram svg"));
  assert.match(root.querySelector("[data-guide-detail]").textContent, /could not load/i);
  assert.match(root.querySelector("[data-guide-detail] button").textContent, /Retry section/i);

  app.destroy();
  dom.window.close();
});

test("the educational disclaimer remains visible when collapsed, loading, and failed", async () => {
  const dom = installGuideDom();
  const root = dom.window.document.querySelector("#immobilizationGuide");
  const detail = deferred();
  const app = createImmobilizationGuide({
    root,
    fetchImpl: async url => url.includes("immobilization-guide.json")
      ? response(GUIDE_FIXTURE)
      : detail.promise
  });
  await app.load();

  assert.match(root.querySelector("[data-guide-quick]").textContent, /Educational quick reference only/i);
  assert.equal(root.querySelectorAll(".note-disclaimer").length, 1);

  root.querySelector("[data-guide-expand]").click();
  assert.match(root.querySelector("[data-guide-quick]").textContent, /Educational quick reference only/i);
  assert.match(root.querySelector("[data-guide-detail]").textContent, /Loading full guide/i);
  assert.equal(root.querySelectorAll(".note-disclaimer").length, 1);

  detail.resolve(response("failed", { ok: false, status: 503 }));
  await tick();
  assert.match(root.querySelector("[data-guide-detail]").textContent, /could not load/i);
  assert.match(root.querySelector("[data-guide-quick]").textContent, /Educational quick reference only/i);
  assert.equal(root.querySelectorAll(".note-disclaimer").length, 1);

  app.destroy();
  dom.window.close();
});

test("rejects malformed runtime indexes before rendering clinical guidance", async () => {
  const cases = [
    ["blank section", payload => { payload.sections[1] = " "; }],
    ["section without an entry", payload => { payload.sections.push("Traction"); }],
    ["duplicate entry id", payload => { payload.entries[1].id = payload.entries[0].id; }],
    ["entry outside section list", payload => { payload.entries[2].section = "Traction"; }],
    ["missing display string", payload => { payload.entries[0].label = ""; }],
    ["invalid bullets", payload => { payload.entries[0].bullets = ["", 42]; }],
    ["unsafe detail path", payload => { payload.entries[0].detailFragment = "../private.html"; }],
    ["missing diagram id", payload => { payload.entries[0].diagram = ""; }],
    ["missing diagram description", payload => { payload.entries[0].diagramAlt = ""; }]
  ];

  for (const [name, mutate] of cases) {
    const dom = installGuideDom();
    const root = dom.window.document.querySelector("#immobilizationGuide");
    const invalid = structuredClone(GUIDE_FIXTURE);
    mutate(invalid);
    const app = createImmobilizationGuide({ root, fetchImpl: async () => response(invalid) });
    await app.load();
    assert.match(root.textContent, /could not load/i, name);
    assert.equal(root.querySelector("[data-guide-quick]"), null, name);
    app.destroy();
    dom.window.close();
  }
});

test("a malformed later section replaces previous guidance with a load error", async () => {
  const dom = installGuideDom();
  const root = dom.window.document.querySelector("#immobilizationGuide");
  let payload = GUIDE_FIXTURE;
  const app = createImmobilizationGuide({ root, fetchImpl: async () => response(payload) });
  await app.load();
  assert.ok(root.querySelector("[data-guide-quick]"));

  payload = structuredClone(GUIDE_FIXTURE);
  payload.sections.push("Traction");
  await app.load();

  assert.match(root.textContent, /could not load/i);
  assert.equal(root.querySelector("[data-guide-quick]"), null);

  app.destroy();
  dom.window.close();
});

test("collapse invalidates a deferred detail response", async () => {
  const dom = installGuideDom();
  const root = dom.window.document.querySelector("#immobilizationGuide");
  const oldDetail = deferred();
  const app = createImmobilizationGuide({
    root,
    fetchImpl: async url => url.includes("immobilization-guide.json")
      ? response(GUIDE_FIXTURE)
      : oldDetail.promise
  });
  await app.load();
  root.querySelector("[data-guide-expand]").click();
  root.querySelector("[data-guide-collapse]").click();

  oldDetail.resolve(response("<p id=stale-collapse>Stale detail</p>"));
  await tick();

  assert.equal(root.querySelector("#stale-collapse"), null);
  assert.equal(root.querySelector("[data-guide-detail]"), null);
  assert.ok(root.querySelector("[data-guide-quick]"));

  app.destroy();
  dom.window.close();
});

test("reload invalidates a deferred detail response", async () => {
  const dom = installGuideDom();
  const root = dom.window.document.querySelector("#immobilizationGuide");
  const oldDetail = deferred();
  let indexRequests = 0;
  const app = createImmobilizationGuide({
    root,
    fetchImpl: async url => {
      if (url.includes("immobilization-guide.json")) {
        indexRequests += 1;
        return response(GUIDE_FIXTURE);
      }
      return oldDetail.promise;
    }
  });
  await app.load();
  root.querySelector("[data-guide-expand]").click();
  await app.load();

  oldDetail.resolve(response("<p id=stale-reload>Stale detail</p>"));
  await tick();

  assert.equal(indexRequests, 2);
  assert.equal(root.querySelector("#stale-reload"), null);
  assert.equal(root.querySelector("[data-guide-detail]"), null);
  assert.ok(root.querySelector("[data-guide-quick]"));

  app.destroy();
  dom.window.close();
});

test("destroy invalidates deferred detail and makes later load a true no-op", async () => {
  const dom = installGuideDom();
  const root = dom.window.document.querySelector("#immobilizationGuide");
  const oldDetail = deferred();
  let fetches = 0;
  const app = createImmobilizationGuide({
    root,
    fetchImpl: async url => {
      fetches += 1;
      return url.includes("immobilization-guide.json")
        ? response(GUIDE_FIXTURE)
        : oldDetail.promise;
    }
  });
  await app.load();
  root.querySelector("[data-guide-expand]").click();
  assert.equal(fetches, 2);

  app.destroy();
  oldDetail.resolve(response("<p id=stale-destroy>Stale detail</p>"));
  await tick();
  await app.load();

  assert.equal(fetches, 2);
  assert.equal(root.childElementCount, 0);
  assert.equal(root.querySelector("#stale-destroy"), null);

  dom.window.close();
});

test("unknown guide diagrams use the controller's accessible text fallback", async () => {
  const dom = installGuideDom();
  const root = dom.window.document.querySelector("#immobilizationGuide");
  const unknown = structuredClone(GUIDE_FIXTURE);
  unknown.entries[0].diagram = "future-device";
  unknown.entries[0].diagramAlt = "A text-only fallback description for the future device.";
  const app = createImmobilizationGuide({ root, fetchImpl: async () => response(unknown) });
  await app.load();

  assert.equal(root.querySelector(".imm-diagram svg"), null);
  assert.equal(root.querySelector(".imm-diagram-fallback").textContent, unknown.entries[0].diagramAlt);

  app.destroy();
  dom.window.close();
});

test("metadata is rendered as text rather than executable markup", async () => {
  const dom = installGuideDom();
  const root = dom.window.document.querySelector("#immobilizationGuide");
  const unsafe = structuredClone(GUIDE_FIXTURE);
  unsafe.entries[0].label = "<img src=x onerror=alert(1)>";
  unsafe.entries[0].device = "<script>unsafe()</script>";
  unsafe.entries[0].bullets = ["<b>bold</b>"];
  unsafe.entries[0].warning = "<a href=javascript:unsafe()>warning</a>";
  const app = createImmobilizationGuide({ root, fetchImpl: async () => response(unsafe) });
  await app.load();

  assert.equal(root.querySelector("img"), null);
  assert.equal(root.querySelector("script"), null);
  assert.equal(root.querySelector('[href^="javascript:"]'), null);
  assert.match(root.textContent, /<img src=x/);
  assert.match(root.textContent, /<b>bold<\/b>/);

  app.destroy();
  dom.window.close();
});
