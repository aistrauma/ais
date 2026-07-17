const normalize = value => String(value || "").toLowerCase().trim().replace(/\s+/g, " ");

export function scoreNote(note, query) {
  if (!query) return 0;
  const terms = normalize(query).split(" ");
  let score = 0;
  for (const term of terms) {
    const title = normalize(note.title);
    const tags = normalize(note.tags.join(" "));
    const summary = normalize(note.summary);
    const category = normalize(note.category);
    const body = normalize(note.searchText);
    if (title.includes(term)) score += 20;
    else if (tags.includes(term)) score += 14;
    else if (category.includes(term)) score += 10;
    else if (summary.includes(term)) score += 6;
    else if (body.includes(term)) score += 1;
    else return -1;
  }
  return score;
}

export function filterNotes(notes, { query, category }) {
  return notes
    .map(note => ({ note, score: scoreNote(note, query) }))
    .filter(item => item.score >= 0 && (category === "All" || item.note.category === category))
    .sort((a, b) => b.score - a.score || a.note.title.localeCompare(b.note.title))
    .map(item => item.note);
}

export function createNotesApp({ root, fetchImpl = fetch, indexUrl = "generated/notes-index.json" }) {
  const landing = root.querySelector("#notesLanding");
  const detail = root.querySelector("#noteDetail");
  const search = root.querySelector("#notesSearch");
  const categoriesNode = root.querySelector("#notesCategories");
  const cards = root.querySelector("#notesCards");
  const count = root.querySelector("#notesCount");
  const status = root.querySelector("#notesStatus");
  let notes = [];
  let category = "All";
  let savedListState = { query: "", category: "All", scrollY: 0 };
  let loadState = "idle";
  let routeToken = 0;

  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const renderCategories = () => {
    categoriesNode.replaceChildren();
    const values = ["All", ...new Set(notes.map(note => note.category).sort())];
    for (const value of values) {
      const button = make("button", value === category ? "note-category active" : "note-category", value);
      button.type = "button";
      button.setAttribute("aria-pressed", String(value === category));
      button.addEventListener("click", () => {
        category = value;
        renderList();
      });
      categoriesNode.append(button);
    }
  };

  const openNote = slug => {
    savedListState = { query: search.value, category, scrollY: window.scrollY };
    location.hash = `notes/${slug}`;
  };

  const renderLoadFailure = () => {
    landing.hidden = false;
    detail.hidden = true;
    status.textContent = "The notes library could not load.";
    const retry = make("button", "tbtn", "Retry");
    retry.id = "notesRetry";
    retry.addEventListener("click", load, { once: true });
    status.append(" ", retry);
  };

  const renderList = () => {
    landing.hidden = false;
    detail.hidden = true;
    const visible = filterNotes(notes, { query: search.value, category });
    renderCategories();
    cards.replaceChildren();
    count.textContent = `${visible.length} note${visible.length === 1 ? "" : "s"}`;
    if (notes.length === 0) status.textContent = "No notes have been published yet.";
    else if (visible.length === 0) status.textContent = "No notes match this search and category.";
    else status.textContent = "";
    for (const note of visible) {
      const card = make("button", "note-card");
      card.type = "button";
      card.append(make("span", "note-card-category", note.category));
      card.append(make("strong", "note-card-title", note.title));
      card.append(make("span", "note-card-summary", note.summary));
      card.append(make("span", "note-tags", note.tags.join(" · ")));
      card.append(make("span", "note-reviewed", `Reviewed ${note.lastReviewed}`));
      card.addEventListener("click", () => openNote(note.slug));
      cards.append(card);
    }
  };

  const backToNotes = () => {
    location.hash = "notes";
  };

  const showNotFound = () => {
    landing.hidden = true;
    detail.hidden = false;
    const back = make("button", "note-back", "Back to Notes");
    back.addEventListener("click", backToNotes);
    detail.replaceChildren(back, make("h2", "", "Note not found"), make("p", "", "This note may have moved or been removed."));
  };

  const showNote = async (slug, token) => {
    const note = notes.find(item => item.slug === slug);
    if (!note) return showNotFound();
    landing.hidden = true;
    detail.hidden = false;
    detail.replaceChildren(make("p", "notes-status", "Loading note…"));
    try {
      const response = await fetchImpl(note.fragment);
      if (!response.ok) throw new Error(`Note request failed (${response.status})`);
      const bodyHtml = await response.text();
      if (token !== routeToken || location.hash !== `#notes/${slug}`) return;
      const back = make("button", "note-back", "← Back to Notes");
      back.addEventListener("click", backToNotes);
      const heading = make("h2", "", note.title);
      const meta = make("div", "note-meta", `${note.category} · Reviewed ${note.lastReviewed}`);
      const body = make("div", "note-body");
      body.innerHTML = bodyHtml;
      const sources = make("section", "note-sources");
      sources.append(make("h3", "", "Sources"));
      const list = make("ul");
      for (const source of note.sources) {
        const item = make("li");
        const link = make("a", "", source.title);
        link.href = source.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        item.append(link);
        list.append(item);
      }
      sources.append(list);
      const disclaimer = make("p", "note-disclaimer", "Educational quick reference only. Verify against current guidance and local protocols.");
      detail.replaceChildren(back, heading, meta, body, sources, disclaimer);
    } catch {
      if (token !== routeToken || location.hash !== `#notes/${slug}`) return;
      const back = make("button", "note-back", "← Back to Notes");
      back.addEventListener("click", backToNotes);
      detail.replaceChildren(back, make("h2", "", note.title), make("p", "notes-status", "This note could not load. Check your connection and try again."));
    }
  };

  const route = async () => {
    if (!location.hash.startsWith("#notes")) return;
    window.showView?.("notes");
    if (loadState === "failed") return renderLoadFailure();
    if (loadState !== "ready") return;
    const token = ++routeToken;
    if (location.hash.startsWith("#notes/")) {
      let slug;
      try {
        slug = decodeURIComponent(location.hash.slice("#notes/".length));
      } catch {
        return showNotFound();
      }
      if (slug) return showNote(slug, token);
    }
    search.value = savedListState.query;
    category = savedListState.category;
    renderList();
    requestAnimationFrame(() => window.scrollTo(0, savedListState.scrollY));
  };

  const load = async () => {
    loadState = "loading";
    if (location.hash.startsWith("#notes")) window.showView?.("notes");
    status.textContent = "Loading notes…";
    try {
      const response = await fetchImpl(indexUrl);
      if (!response.ok) throw new Error(`Index request failed (${response.status})`);
      const payload = await response.json();
      if (payload.version !== 1 || !Array.isArray(payload.notes)) throw new Error("Unsupported notes index");
      notes = payload.notes;
      loadState = "ready";
      await route();
      if (!location.hash.startsWith("#notes")) renderList();
    } catch {
      loadState = "failed";
      renderLoadFailure();
    }
  };

  const onInput = () => {
    if (loadState === "ready") renderList();
  };
  const onHashChange = () => { void route(); };
  const notesTab = root.closest("#viewNotes")?.ownerDocument.querySelector('[data-view="notes"]');
  const onNotesTabClick = () => {
    if (!location.hash.startsWith("#notes")) location.hash = "notes";
  };
  search.addEventListener("input", onInput);
  window.addEventListener("hashchange", onHashChange);
  notesTab?.addEventListener("click", onNotesTabClick);

  return {
    load,
    route,
    destroy() {
      search.removeEventListener("input", onInput);
      window.removeEventListener("hashchange", onHashChange);
      notesTab?.removeEventListener("click", onNotesTabClick);
    }
  };
}

if (typeof document !== "undefined") {
  const root = document.querySelector("#notesApp");
  if (root) void createNotesApp({ root }).load();
}
