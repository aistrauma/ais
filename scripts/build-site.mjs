import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { IMMOBILIZATION_GUIDE_ENTRIES } from "../notes/initial-immobilization-guide.data.mjs";
import { compileImmobilizationGuide } from "./lib/immobilization-guide.mjs";
import { compileNotes } from "./lib/notes.mjs";

async function walk(dir) {
  const found = [];
  for (const name of (await readdir(dir)).sort()) {
    if (name === "generated" || name === ".DS_Store") continue;
    const full = path.join(dir, name);
    const info = await stat(full);
    if (info.isDirectory()) found.push(...await walk(full));
    else found.push(full);
  }
  return found;
}

export async function buildSite({ repoRoot, guideEntries = [] }) {
  const siteDir = path.join(repoRoot, "site");
  const generatedDir = path.join(siteDir, "generated");
  const categories = JSON.parse(await readFile(path.join(repoRoot, "notes/categories.json"), "utf8"));
  if (!Array.isArray(categories) || categories.some(item => typeof item !== "string" || !item.trim())) {
    throw new Error("notes/categories.json must be an array of non-empty strings");
  }
  const notes = await compileNotes({ notesDir: path.join(repoRoot, "notes"), categories });
  await rm(generatedDir, { recursive: true, force: true });
  await mkdir(path.join(generatedDir, "notes"), { recursive: true });

  const indexNotes = [];
  for (const { html, sections, sourceFile, ...note } of notes) {
    const fragment = `generated/notes/${note.slug}.html`;
    await writeFile(path.join(siteDir, fragment), html);
    indexNotes.push({ ...note, fragment });
  }
  await writeFile(path.join(generatedDir, "notes-index.json"), `${JSON.stringify({ version: 1, notes: indexNotes })}\n`);

  const generatedGuideFiles = [];
  const guideNote = notes.find(note => note.slug === "initial-immobilization-guide");
  if (guideNote) {
    const guideIndex = compileImmobilizationGuide({ note: guideNote, entries: guideEntries });
    const sectionDir = path.join(generatedDir, "notes", guideNote.slug);
    await mkdir(sectionDir, { recursive: true });
    for (const section of guideNote.sections) {
      const sectionFile = path.join(sectionDir, `${section.id}.html`);
      await writeFile(sectionFile, section.html);
      generatedGuideFiles.push(sectionFile);
    }
    const guideIndexFile = path.join(generatedDir, "immobilization-guide.json");
    await writeFile(guideIndexFile, `${JSON.stringify(guideIndex)}\n`);
    generatedGuideFiles.push(guideIndexFile);
  }

  const staticFiles = await walk(siteDir);
  const generatedFragments = indexNotes.map(note => path.join(siteDir, note.fragment));
  const indexFile = path.join(generatedDir, "notes-index.json");
  const hashFiles = [...new Set([...staticFiles, ...generatedFragments, indexFile, ...generatedGuideFiles])].sort();
  const digest = createHash("sha256");
  for (const file of hashFiles) {
    const relativePath = Buffer.from(path.relative(siteDir, file));
    const contents = await readFile(file);
    digest
      .update(`${relativePath.length}:`)
      .update(relativePath)
      .update(`${contents.length}:`)
      .update(contents);
  }
  const buildId = digest.digest("hex").slice(0, 12);
  const assets = hashFiles.map(file => {
    const relative = path.relative(siteDir, file).split(path.sep).join("/");
    return relative === "index.html" ? "./" : `./${relative}`;
  });
  assets.push("./generated/sw-meta.js");
  const uniqueAssets = [...new Set(assets)].sort();
  await writeFile(
    path.join(generatedDir, "sw-meta.js"),
    `self.AIS_BUILD_ID = ${JSON.stringify(buildId)};\nself.AIS_PRECACHE = ${JSON.stringify(uniqueAssets, null, 2)};\n`
  );
  return { noteCount: notes.length, buildId, assets: uniqueAssets };
}

export async function buildProject({ repoRoot }) {
  return buildSite({ repoRoot, guideEntries: IMMOBILIZATION_GUIDE_ENTRIES });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const result = await buildProject({ repoRoot });
  console.log(`Built ${result.noteCount} notes (${result.buildId})`);
}
