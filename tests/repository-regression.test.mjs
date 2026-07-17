import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

async function missing(path) {
  try { await access(path); return false; } catch { return true; }
}

test("deployed app contains no AI assistant or Netlify runtime", async () => {
  const html = await readFile("site/index.html", "utf8");
  for (const forbidden of ["viewAI", "aiSend", "aiQuota", "Gemini", ".netlify/functions/assistant", "GOOGLE_AI_KEY"]) {
    assert.doesNotMatch(html, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }
  assert.equal(await missing("netlify/functions/assistant.mjs"), true);
  assert.equal(await missing("netlify.toml"), true);
});

test("core views and AIS data remain present", async () => {
  const html = await readFile("site/index.html", "utf8");
  for (const required of ["viewSearch", "viewTemplates", "viewTQIP", "viewNotes", "viewSettings", "const FULLDICT", "AIS08-Dictionary-redacted.pdf"]) {
    assert.match(html, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
