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
    for (const field of TEXT_FIELDS) {
      if (typeof entry[field] !== "string" || !entry[field].trim()) errors.push(`entries[${index}].${field} is required`);
    }
    if (owners.has(entry.id)) errors.push(`duplicate guide id "${entry.id}"`);
    owners.add(entry.id);
    if (!headings.has(entry.headingId)) errors.push(`entries[${index}].headingId does not match a note section`);
    if (!DIAGRAM_IDS.has(entry.diagram)) errors.push(`entries[${index}].diagram is unknown`);
    if (!Array.isArray(entry.bullets) || entry.bullets.length < 3 || entry.bullets.length > 5 || entry.bullets.some(item => typeof item !== "string" || !item.trim())) {
      errors.push(`entries[${index}].bullets must contain 3-5 strings`);
    }
    if (!Array.isArray(entry.searchTerms) || entry.searchTerms.length === 0 || entry.searchTerms.some(item => typeof item !== "string" || !item.trim())) {
      errors.push(`entries[${index}].searchTerms is required`);
    }
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
