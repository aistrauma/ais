import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { createNotesApp, filterNotes, scoreNote } from "../site/notes.js";

const note = (overrides = {}) => ({
  slug: "teg",
  title: "Interpreting a TEG",
  category: "Resuscitation",
  tags: ["TEG", "coagulopathy"],
  summary: "Targeted treatment for coagulopathy.",
  lastReviewed: "2026-07-17",
  sources: [{ title: "ACS guidance", url: "https://www.facs.org/" }],
  searchText: "interpreting a teg coagulopathy",
  fragment: "generated/notes/teg.html",
  ...overrides
});

const FIXTURES = [
  note({ slug: "teg", title: "Interpreting a TEG", category: "Resuscitation", searchText: "teg coagulopathy resuscitation" }),
  note({ slug: "burn-fluids", title: "Burn fluid resuscitation", category: "Burns", tags: ["burns", "resuscitation"], searchText: "burn fluid resuscitation" }),
  note({ slug: "burn-wounds", title: "Burn wound care", category: "Burns", tags: ["burns"], searchText: "burn wound dressing" })
];

const response = (payload, { ok = true, status = 200 } = {}) => ({
  ok,
  status,
  json: async () => payload,
  text: async () => String(payload)
});

const tick = () => new Promise(resolve => setTimeout(resolve, 0));
const deferred = () => {
  let resolve;
  return { promise: new Promise(done => { resolve = done; }), resolve };
};

function installDom(hash = "") {
  const dom = new JSDOM(`<!doctype html><body>
    <div id="content"><div id="viewNotes"><button data-view="notes">Notes</button><section id="notesApp">
      <div id="notesBrowser"><div class="notes-head"><h2 id="notesTitle">Notes</h2></div><div id="notesLanding"><input id="notesSearch"><div id="notesCategories"></div><div id="notesCount"></div><div id="notesStatus"></div><div id="notesCards"></div></div></div>
      <article id="noteDetail" hidden></article>
    </section></div></div>
  </body>`, { url: `https://example.test/${hash}` });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.location = dom.window.location;
  globalThis.history = dom.window.history;
  globalThis.requestAnimationFrame = callback => callback();
  dom.window.scrollTo = () => {};
  return dom;
}

function cleanupDom(dom) {
  dom.window.close();
  delete globalThis.window;
  delete globalThis.document;
  delete globalThis.location;
  delete globalThis.history;
  delete globalThis.requestAnimationFrame;
}

test("ranks title and tag matches above body-only matches", () => {
  const notes = [
    note({ title: "Interpreting a TEG", tags: ["coagulopathy"], searchText: "interpreting a teg coagulopathy" }),
    note({ slug: "massive-transfusion", title: "Massive transfusion", tags: ["blood"], searchText: "massive transfusion includes teg interpretation" })
  ];
  assert.equal(filterNotes(notes, { query: "teg", category: "All" })[0].slug, "teg");
  assert.equal(scoreNote(notes[1], "missing"), -1);
});

test("combines category and keyword filters", () => {
  const result = filterNotes(FIXTURES, { query: "resuscitation", category: "Burns" });
  assert.deepEqual(result.map(item => item.slug), ["burn-fluids"]);
});

test("renders an empty library without throwing", async t => {
  const dom = installDom();
  t.after(() => cleanupDom(dom));
  const app = createNotesApp({ root: document.querySelector("#notesApp"), fetchImpl: async () => response({ version: 1, notes: [] }) });
  await app.load();
  assert.match(document.querySelector("#notesStatus").textContent, /No notes have been published yet/i);
  app.destroy();
});

test("renders load failure and retry control", async t => {
  const dom = installDom();
  t.after(() => cleanupDom(dom));
  const app = createNotesApp({ root: document.querySelector("#notesApp"), fetchImpl: async () => { throw new Error("offline"); } });
  await app.load();
  assert.match(document.querySelector("#notesStatus").textContent, /could not load/i);
  assert.ok(document.querySelector("#notesRetry"));
  app.destroy();
});

test("keeps the failure and retry UI when input changes after a failed load", async t => {
  const dom = installDom();
  t.after(() => cleanupDom(dom));
  const app = createNotesApp({ root: document.querySelector("#notesApp"), fetchImpl: async () => { throw new Error("offline"); } });
  await app.load();
  const search = document.querySelector("#notesSearch");
  search.value = "teg";
  search.dispatchEvent(new window.Event("input"));
  assert.match(document.querySelector("#notesStatus").textContent, /could not load/i);
  assert.ok(document.querySelector("#notesRetry"));
  app.destroy();
});

test("keeps the loading UI when input changes before the index resolves", async t => {
  const dom = installDom();
  t.after(() => cleanupDom(dom));
  const index = deferred();
  const app = createNotesApp({ root: document.querySelector("#notesApp"), fetchImpl: async () => index.promise });
  const loading = app.load();
  const search = document.querySelector("#notesSearch");
  search.value = "teg";
  search.dispatchEvent(new window.Event("input"));
  assert.match(document.querySelector("#notesStatus").textContent, /Loading notes/i);
  index.resolve(response({ version: 1, notes: [] }));
  await loading;
  app.destroy();
});

test("shows a direct Notes hash when the index cannot load", async t => {
  const dom = installDom("#notes/teg");
  t.after(() => cleanupDom(dom));
  let shownView = "";
  window.showView = view => { shownView = view; };
  const app = createNotesApp({ root: document.querySelector("#notesApp"), fetchImpl: async () => { throw new Error("offline"); } });
  await app.load();
  assert.equal(shownView, "notes");
  assert.match(document.querySelector("#notesStatus").textContent, /could not load/i);
  assert.ok(document.querySelector("#notesRetry"));
  app.destroy();
});

test("preserves the index failure and retry control after Notes routing", async t => {
  const dom = installDom();
  t.after(() => cleanupDom(dom));
  const app = createNotesApp({ root: document.querySelector("#notesApp"), fetchImpl: async () => { throw new Error("offline"); } });
  await app.load();
  history.replaceState(null, "", "#notes");
  await app.route();
  assert.match(document.querySelector("#notesStatus").textContent, /could not load/i);
  assert.ok(document.querySelector("#notesRetry"));
  app.destroy();
});

test("loads a direct note hash and its sanitized fragment", async t => {
  const dom = installDom("#notes/teg");
  t.after(() => cleanupDom(dom));
  let shownView = "";
  window.showView = view => { shownView = view; };
  const app = createNotesApp({
    root: document.querySelector("#notesApp"),
    fetchImpl: async url => url === "generated/notes-index.json"
      ? response({ version: 1, notes: [FIXTURES[0]] })
      : response("<h2>Thresholds</h2><p>Sanitized content.</p>")
  });
  await app.load();
  assert.equal(shownView, "notes");
  assert.match(document.querySelector("#noteDetail").textContent, /Thresholds/);
  assert.equal(document.querySelector("#notesLanding").hidden, false);
  assert.equal(document.querySelector("#notesApp").classList.contains("notes-detail-open"), true);
  assert.equal(document.querySelector("#content").classList.contains("notes-reading"), true);
  app.destroy();
});

test("shows tags in the full note view", async t => {
  const dom = installDom("#notes/teg");
  t.after(() => cleanupDom(dom));
  const app = createNotesApp({
    root: document.querySelector("#notesApp"),
    fetchImpl: async url => url === "generated/notes-index.json"
      ? response({ version: 1, notes: [FIXTURES[0]] })
      : response("<p>Sanitized content.</p>")
  });

  await app.load();

  assert.equal(document.querySelector("#noteDetail .note-tags").textContent, "TEG · coagulopathy");
  app.destroy();
});

test("retries a failed note fragment and renders the successful retry", async t => {
  const dom = installDom("#notes/teg");
  t.after(() => cleanupDom(dom));
  let fragmentAttempts = 0;
  const app = createNotesApp({
    root: document.querySelector("#notesApp"),
    fetchImpl: async url => {
      if (url === "generated/notes-index.json") return response({ version: 1, notes: [FIXTURES[0]] });
      fragmentAttempts += 1;
      if (fragmentAttempts === 1) throw new Error("offline");
      return response("<p>Recovered content</p>");
    }
  });

  await app.load();
  assert.ok(document.querySelector("#noteRetry"));
  document.querySelector("#noteRetry").click();
  await tick();

  assert.equal(fragmentAttempts, 2);
  assert.match(document.querySelector("#noteDetail").textContent, /Recovered content/);
  app.destroy();
});

test("does not let a stale note retry overwrite the active note", async t => {
  const dom = installDom("#notes/first");
  t.after(() => cleanupDom(dom));
  const retry = deferred();
  let firstAttempts = 0;
  const firstNote = note({ slug: "first", title: "First note", fragment: "generated/notes/first.html" });
  const secondNote = note({ slug: "second", title: "Second note", fragment: "generated/notes/second.html" });
  const app = createNotesApp({
    root: document.querySelector("#notesApp"),
    fetchImpl: async url => {
      if (url === "generated/notes-index.json") return response({ version: 1, notes: [firstNote, secondNote] });
      if (url === firstNote.fragment) {
        firstAttempts += 1;
        if (firstAttempts === 1) throw new Error("offline");
        return retry.promise;
      }
      return response("<p>Second body</p>");
    }
  });

  await app.load();
  document.querySelector("#noteRetry").click();
  history.replaceState(null, "", "#notes/second");
  await app.route();
  retry.resolve(response("<p>First retry body</p>"));
  await tick();

  assert.match(document.querySelector("#noteDetail").textContent, /Second body/);
  assert.doesNotMatch(document.querySelector("#noteDetail").textContent, /First retry body/);
  app.destroy();
});

test("renders note not found for unknown and malformed note hashes", async t => {
  const dom = installDom("#notes/missing");
  t.after(() => cleanupDom(dom));
  const app = createNotesApp({ root: document.querySelector("#notesApp"), fetchImpl: async () => response({ version: 1, notes: FIXTURES }) });
  await app.load();
  assert.match(document.querySelector("#noteDetail").textContent, /Note not found/);
  history.replaceState(null, "", "#notes/%E0%A4%A");
  await assert.doesNotReject(app.route());
  assert.match(document.querySelector("#noteDetail").textContent, /Note not found/);
  app.destroy();
});

test("Back to Notes restores the previous query and category", async t => {
  const dom = installDom();
  t.after(() => cleanupDom(dom));
  const app = createNotesApp({
    root: document.querySelector("#notesApp"),
    fetchImpl: async url => url === "generated/notes-index.json"
      ? response({ version: 1, notes: FIXTURES })
      : response("<p>Burn content</p>")
  });
  await app.load();
  const search = document.querySelector("#notesSearch");
  search.value = "resuscitation";
  search.dispatchEvent(new window.Event("input"));
  document.querySelectorAll(".note-category").forEach(button => {
    if (button.textContent === "Burns") button.click();
  });
  document.querySelector(".note-card").click();
  await tick();
  document.querySelector(".note-back").click();
  await tick();
  assert.equal(search.value, "resuscitation");
  assert.equal(document.querySelector(".note-category.active").textContent, "Burns");
  assert.equal(document.querySelectorAll(".note-card").length, 1);
  app.destroy();
});

test("does not let a stale note fragment overwrite the current note", async t => {
  const dom = installDom();
  t.after(() => cleanupDom(dom));
  const first = deferred();
  const second = deferred();
  const firstNote = note({ slug: "first", title: "First note", fragment: "generated/notes/first.html" });
  const secondNote = note({ slug: "second", title: "Second note", fragment: "generated/notes/second.html" });
  const app = createNotesApp({
    root: document.querySelector("#notesApp"),
    fetchImpl: async url => {
      if (url === "generated/notes-index.json") return response({ version: 1, notes: [firstNote, secondNote] });
      if (url === firstNote.fragment) return first.promise;
      return second.promise;
    }
  });
  await app.load();
  history.replaceState(null, "", "#notes/first");
  const firstRoute = app.route();
  history.replaceState(null, "", "#notes/second");
  const secondRoute = app.route();
  second.resolve(response("<p>Second body</p>"));
  await secondRoute;
  first.resolve(response("<p>First body</p>"));
  await firstRoute;
  assert.match(document.querySelector("#noteDetail").textContent, /Second body/);
  assert.doesNotMatch(document.querySelector("#noteDetail").textContent, /First body/);
  assert.equal(location.hash, "#notes/second");
  app.destroy();
});

test("renders index metadata as text rather than markup", async t => {
  const dom = installDom();
  t.after(() => cleanupDom(dom));
  const unsafe = note({ title: '<img src=x onerror="window.bad = true">', category: "<b>Burns</b>", tags: ["<i>tag</i>"] });
  const app = createNotesApp({ root: document.querySelector("#notesApp"), fetchImpl: async () => response({ version: 1, notes: [unsafe] }) });
  await app.load();
  assert.equal(document.querySelector("#notesCards img"), null);
  assert.equal(document.querySelector(".note-card-title").textContent, unsafe.title);
  app.destroy();
});

test("destroy removes Notes navigation listeners", t => {
  const dom = installDom();
  t.after(() => cleanupDom(dom));
  const app = createNotesApp({ root: document.querySelector("#notesApp"), fetchImpl: async () => response({ version: 1, notes: [] }) });
  app.destroy();
  document.querySelector('[data-view="notes"]').click();
  assert.equal(location.hash, "");
});

test("loads the Notes tab assets and routes the shell to the Notes view", async () => {
  const [html, css, guideCss] = await Promise.all([
    readFile(new URL("../site/index.html", import.meta.url), "utf8"),
    readFile(new URL("../site/notes.css", import.meta.url), "utf8"),
    readFile(new URL("../site/immobilization-guide.css", import.meta.url), "utf8").catch(() => "")
  ]);
  assert.match(html, /<link rel="stylesheet" href="notes\.css">/);
  assert.match(html, /<link rel="stylesheet" href="immobilization-guide\.css">/);
  assert.match(html, /<button data-view="notes"><span class="ticon">🗒️<\/span><span>Notes<\/span><\/button>/);
  assert.match(html, /<div class="tview" id="viewNotes">/);
  assert.match(html, /<div id="notesBrowser">/);
  assert.ok(html.indexOf('<input id="notesSearch"') < html.indexOf('<div id="notesCards"'));
  assert.match(html, /const VIEWS = \{ search:"viewSearch", templates:"viewTemplates", tqip:"viewTQIP", notes:"viewNotes", settings:"viewSettings" \};\s*window\.showView = showView;/);
  assert.match(html, /<script type="module" src="immobilization-guide\.js"><\/script>/);
  assert.match(html, /<script type="module" src="notes\.js"><\/script>/);
  assert.ok(html.indexOf('src="immobilization-guide.js"') < html.indexOf('src="notes.js"'));
  assert.match(html, /if \(b\.dataset\.view !== "notes" && location\.hash\.startsWith\("#notes"\)\) history\.replaceState\(null, "", location\.pathname \+ location\.search\);/);
  assert.match(css, /\.notes-grid\{display:grid/);
  assert.match(css, /\.note-body table/);
  assert.match(css, /\.notes-detail-open\{display:grid;grid-template-columns:minmax\(300px,400px\) minmax\(0,1fr\)/);
  assert.match(css, /\.notes-detail-open #notesBrowser\{grid-column:1;min-width:0\}/);
  assert.match(guideCss, /\.imm-feature\{[^}]*display:grid/);
  assert.match(guideCss, /\.imm-guide-sections/);
  assert.match(guideCss, /\.imm-guide-entries/);
  assert.match(guideCss, /\.imm-guide-quick/);
  assert.match(guideCss, /:focus-visible\{outline:3px solid var\(--accent\)/);
  assert.doesNotMatch(guideCss, /imm-diagram/);
  for (const [, transition] of guideCss.matchAll(/transition:([^;}]+)/g)) {
    assert.doesNotMatch(transition, /background-color|border-color|(?:^|,)color(?: |$)/);
  }
  assert.match(guideCss, /@media\(max-width:899px\)/);
  assert.match(html, /#content\.notes-reading\{max-width:1400px;margin:0\}/);
  assert.match(html, /window\.openInlinePDF = function\(printedPage, label\)\{\s*window\.closeNotesReader\?\.\(\);/);
  assert.match(html, /if \(v !== "notes"\) window\.closeNotesReader\?\.\(\);/);
});

test("clears the reader state when the PDF direction closes Notes", async t => {
  const dom = installDom("#notes/teg");
  t.after(() => cleanupDom(dom));
  const app = createNotesApp({
    root: document.querySelector("#notesApp"),
    fetchImpl: async url => url === "generated/notes-index.json"
      ? response({ version: 1, notes: [FIXTURES[0]] })
      : response("<p>Reader body</p>")
  });
  await app.load();
  window.closeNotesReader();
  assert.equal(document.querySelector("#notesApp").classList.contains("notes-detail-open"), false);
  assert.equal(document.querySelector("#content").classList.contains("notes-reading"), false);
  assert.equal(location.hash, "");
  app.destroy();
});
