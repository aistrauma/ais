import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { marked, Renderer } from "marked";
import sanitizeHtml from "sanitize-html";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const REQUIRED_TEXT = ["title", "slug", "category", "summary"];

function isExactDate(value) {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function textOnly(html) {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
}

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
      a: (_tag, attrs) => ({
        tagName: "a",
        attribs: { href: attrs.href || "#", target: "_blank", rel: "noopener noreferrer" }
      })
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

export function parseNoteSource({ source, filePath, categories }) {
  const { data, content } = matter(source);
  const errors = [];
  const lastReviewed = data.last_reviewed instanceof Date
    ? data.last_reviewed.toISOString().slice(0, 10)
    : data.last_reviewed;
  for (const field of REQUIRED_TEXT) {
    if (typeof data[field] !== "string" || !data[field].trim()) errors.push(`${field} is required`);
  }
  if (typeof data.slug === "string" && !SLUG.test(data.slug)) errors.push("slug must be lowercase and URL-safe");
  if (typeof data.category === "string" && !categories.includes(data.category)) errors.push("category is not listed in notes/categories.json");
  if (!Array.isArray(data.tags) || data.tags.length === 0 || data.tags.some(tag => typeof tag !== "string" || !tag.trim())) errors.push("tags must contain at least one non-empty string");
  if (!isExactDate(lastReviewed)) errors.push("last_reviewed must use YYYY-MM-DD and be a real date");
  if (!Array.isArray(data.sources) || data.sources.length === 0) {
    errors.push("sources must contain at least one source");
  } else {
    data.sources.forEach((sourceItem, index) => {
      if (!sourceItem || typeof sourceItem.title !== "string" || !sourceItem.title.trim()) errors.push(`sources[${index}].title is required`);
      try {
        const url = new URL(sourceItem?.url);
        if (url.protocol !== "https:") throw new Error();
      } catch {
        errors.push(`sources[${index}].url must be a valid HTTPS URL`);
      }
    });
  }
  if (!content.trim()) errors.push("body must not be empty");
  if (errors.length) throw new Error(`${filePath}: ${errors.join("; ")}`);

  const html = renderMarkdown(content);
  const tags = data.tags.map(tag => tag.trim());
  const searchText = [data.title, textOnly(html), data.category, ...tags, data.summary]
    .join(" ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  return {
    title: data.title.trim(),
    slug: data.slug,
    category: data.category,
    tags,
    summary: data.summary.trim(),
    lastReviewed,
    sources: data.sources.map(item => ({ title: item.title.trim(), url: item.url })),
    html,
    sections: extractH2Sections(html),
    searchText
  };
}

export async function compileNotes({ notesDir, categories }) {
  const files = (await readdir(notesDir)).filter(name => name.endsWith(".md")).sort();
  const notes = [];
  const failures = [];
  for (const name of files) {
    const filePath = path.join(notesDir, name);
    try {
      notes.push({ ...parseNoteSource({ source: await readFile(filePath, "utf8"), filePath, categories }), sourceFile: name });
    } catch (error) {
      failures.push(error.message);
    }
  }
  const owners = new Map();
  for (const note of notes) {
    if (owners.has(note.slug)) failures.push(`duplicate slug "${note.slug}" in ${owners.get(note.slug)} and ${note.sourceFile}`);
    else owners.set(note.slug, note.sourceFile);
  }
  if (failures.length) throw new Error(failures.join("\n"));
  return notes.sort((a, b) => a.title.localeCompare(b.title));
}
