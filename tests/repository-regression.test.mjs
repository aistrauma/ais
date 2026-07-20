import test from "node:test";
import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";

const DEPLOYED_TEXT_EXTENSIONS = new Set([".html", ".js", ".css", ".json", ".webmanifest"]);
const FORBIDDEN_DEPLOYED_TOKENS = ["AI Assistant", "Gemini", "GOOGLE_AI_KEY", ".netlify", "viewAI", "aiSend", "aiQuota"];

async function missing(path) {
  try { await access(path); return false; } catch { return true; }
}

async function deployedTextAssets(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async entry => {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) return deployedTextAssets(path);
    return DEPLOYED_TEXT_EXTENSIONS.has(`.${entry.name.split(".").pop()}`) ? [path] : [];
  }));
  return nested.flat();
}

test("deployed app contains no AI assistant or Netlify runtime", async () => {
  for (const path of await deployedTextAssets("site")) {
    const contents = await readFile(path, "utf8");
    for (const forbidden of FORBIDDEN_DEPLOYED_TOKENS) {
      assert.doesNotMatch(contents, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), `${path} must not contain ${forbidden}`);
    }
  }
  assert.equal(await missing("netlify/functions/assistant.mjs"), true);
  assert.equal(await missing("netlify.toml"), true);
});

test("keeps legacy Netlify local state out of version control", async () => {
  const gitignore = await readFile(".gitignore", "utf8");
  assert.match(gitignore, /^\.netlify\/$/m);
});

test("core views and AIS data remain present", async () => {
  const html = await readFile("site/index.html", "utf8");
  for (const required of ["viewSearch", "viewTemplates", "viewTQIP", "viewNotes", "viewSettings", "const FULLDICT", "AIS08-Dictionary-redacted.pdf"]) {
    assert.match(html, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("keeps the diagram-free immobilization guide source and assets", async () => {
  for (const path of [
    "notes/initial-immobilization-guide.md",
    "notes/initial-immobilization-guide.data.mjs",
    "site/immobilization-guide.js",
    "site/immobilization-guide.css"
  ]) assert.equal(await missing(path), false, path);
  assert.equal(await missing("site/immobilization-diagrams.js"), true);
});

test("documents the interactive featured guide review workflow", async () => {
  const authoringGuide = await readFile("docs/notes-authoring.md", "utf8");
  assert.match(authoringGuide, /^## Interactive featured guides$/m);
  assert.match(authoringGuide, /Every companion `headingId` must match an H2 in the Markdown note\./);
  assert.match(authoringGuide, /Clinical review must cover the prose before merge\./);
});
