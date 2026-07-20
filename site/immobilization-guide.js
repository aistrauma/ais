import { renderImmobilizationDiagram } from "./immobilization-diagrams.js";

const DISCLAIMER = "Educational quick reference only. Verify against current guidance and local protocols.";
const DETAIL_FRAGMENT = /^generated\/notes\/[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*\.html$/;
const ENTRY_TEXT_FIELDS = ["id", "section", "label", "device", "warning", "diagram", "diagramAlt"];

const isNonemptyString = value => typeof value === "string" && Boolean(value.trim());

const isHttpsSource = source => {
  if (!source || !isNonemptyString(source.title) || !isNonemptyString(source.url)) return false;
  try {
    return new URL(source.url).protocol === "https:";
  } catch {
    return false;
  }
};

function isValidGuideIndex(value) {
  if (
    !value
    || value.version !== 1
    || !Array.isArray(value.sections)
    || value.sections.length === 0
    || !Array.isArray(value.entries)
    || value.entries.length === 0
    || !Array.isArray(value.sources)
    || !value.sources.every(isHttpsSource)
    || !value.sections.every(isNonemptyString)
    || new Set(value.sections).size !== value.sections.length
  ) return false;

  const sections = new Set(value.sections);
  const ids = new Set();
  for (const entry of value.entries) {
    if (
      !entry
      || !ENTRY_TEXT_FIELDS.every(field => isNonemptyString(entry[field]))
      || !sections.has(entry.section)
      || ids.has(entry.id)
      || !Array.isArray(entry.bullets)
      || entry.bullets.length === 0
      || !entry.bullets.every(isNonemptyString)
      || !isNonemptyString(entry.detailFragment)
      || !DETAIL_FRAGMENT.test(entry.detailFragment)
    ) return false;
    ids.add(entry.id);
  }

  return value.sections.every(name => value.entries.some(entry => entry.section === name));
}

export function createImmobilizationGuide({
  root,
  fetchImpl = fetch,
  indexUrl = "generated/immobilization-guide.json"
}) {
  let payload = null;
  let section = "";
  let selectedId = "";
  let expanded = false;
  let detailToken = 0;
  let loadToken = 0;
  let destroyed = false;

  const make = (tag, className, text) => {
    const node = root.ownerDocument.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const activeEntry = () => payload?.entries.find(entry => entry.id === selectedId);

  const focusControl = (attribute, value) => {
    const match = [...root.querySelectorAll(`[${attribute}]`)]
      .find(node => node.getAttribute(attribute) === value);
    match?.focus();
  };

  function renderLoading() {
    const skeleton = make("div", "imm-loading-skeleton");
    skeleton.setAttribute("aria-label", "Loading Initial Immobilization Guide");
    skeleton.innerHTML = "<span></span><span></span><span></span>";
    root.replaceChildren(skeleton);
  }

  function renderLoadError() {
    const message = make("p", "imm-error", "The Initial Immobilization Guide could not load.");
    const retry = make("button", "tbtn", "Retry");
    retry.type = "button";
    retry.addEventListener("click", () => void load(), { once: true });
    root.replaceChildren(message, retry);
  }

  function renderDetailError(entry) {
    const detail = root.querySelector("[data-guide-detail]");
    if (!detail) return;
    const message = make("p", "imm-error", "The full guide section could not load.");
    const retry = make("button", "tbtn", "Retry section");
    retry.type = "button";
    retry.addEventListener("click", () => {
      detail.replaceChildren(make("p", "imm-detail-status", "Loading full guide…"));
      void showDetail(entry, ++detailToken);
    }, { once: true });
    detail.replaceChildren(message, retry);
  }

  function renderSources(container) {
    const sources = make("section", "imm-guide-sources");
    sources.append(make("h4", "", "Sources"));
    const list = make("ul");
    for (const source of payload.sources) {
      let url;
      try {
        url = new URL(source.url);
      } catch {
        continue;
      }
      if (url.protocol !== "https:") continue;
      const item = make("li");
      const link = make("a", "", source.title);
      link.href = url.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      item.append(link);
      list.append(item);
    }
    sources.append(list);
    container.append(sources);
  }

  async function showDetail(entry, token) {
    try {
      const response = await fetchImpl(entry.detailFragment);
      if (!response.ok) throw new Error(`Detail request failed (${response.status})`);
      const html = await response.text();
      if (destroyed || token !== detailToken || activeEntry()?.id !== entry.id || !expanded) return;
      const detail = root.querySelector("[data-guide-detail]");
      if (!detail) return;
      detail.innerHTML = html;
      renderSources(detail);
    } catch {
      if (destroyed || token !== detailToken || activeEntry()?.id !== entry.id || !expanded) return;
      renderDetailError(entry);
    }
  }

  function selectEntry(id, restoreFocus = false) {
    selectedId = id;
    expanded = false;
    detailToken += 1;
    render();
    if (restoreFocus) focusControl("data-guide-entry", id);
  }

  function selectSection(name, restoreFocus = false) {
    section = name;
    selectedId = payload.entries.find(entry => entry.section === section)?.id || "";
    expanded = false;
    detailToken += 1;
    render();
    if (restoreFocus) focusControl("data-guide-section", name);
  }

  function renderSectionButtons() {
    const container = make("div", "imm-guide-sections");
    for (const name of payload.sections) {
      const button = make("button", "imm-section", name);
      button.type = "button";
      button.dataset.guideSection = name;
      button.setAttribute("aria-pressed", String(name === section));
      button.addEventListener("click", () => selectSection(name, true));
      container.append(button);
    }
    return container;
  }

  function renderEntryButtons() {
    const container = make("div", "imm-guide-entries");
    for (const entry of payload.entries.filter(item => item.section === section)) {
      const button = make("button", "imm-entry");
      button.type = "button";
      button.dataset.guideEntry = entry.id;
      if (entry.id === selectedId) button.setAttribute("aria-current", "true");
      button.append(make("strong", "imm-entry-label", entry.label));
      button.append(make("span", "imm-entry-device", entry.device));
      button.addEventListener("click", () => selectEntry(entry.id, true));
      container.append(button);
    }
    return container;
  }

  function renderQuickGuide() {
    const entry = activeEntry();
    const container = make("article", "imm-guide-quick");
    container.dataset.guideQuick = "";
    container.append(make("h3", "", entry.label));
    container.append(make("p", "imm-guide-device", entry.device));
    const list = make("ul", "imm-guide-actions");
    for (const bullet of entry.bullets) list.append(make("li", "", bullet));
    container.append(list);
    container.append(make("p", "imm-guide-warning", entry.warning));
    container.append(make("p", "note-disclaimer", DISCLAIMER));

    const toggle = make("button", "imm-expand", expanded ? "Collapse full guide" : "Expand full guide");
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", String(expanded));
    if (expanded) {
      toggle.dataset.guideCollapse = "";
      toggle.addEventListener("click", () => {
        expanded = false;
        detailToken += 1;
        render();
        focusControl("data-guide-expand", "");
      });
    } else {
      toggle.dataset.guideExpand = "";
      toggle.addEventListener("click", () => {
        expanded = true;
        render();
        focusControl("data-guide-collapse", "");
      });
    }
    container.append(toggle);
    container.append(renderImmobilizationDiagram({
      id: entry.diagram,
      document: root.ownerDocument,
      alt: entry.diagramAlt
    }));
    return container;
  }

  function renderExpandedDetail() {
    if (!expanded) return null;
    const entry = activeEntry();
    const detail = make("section", "imm-guide-detail");
    detail.dataset.guideDetail = "";
    detail.append(make("p", "imm-detail-status", "Loading full guide…"));
    void showDetail(entry, ++detailToken);
    return detail;
  }

  function render() {
    if (destroyed || !payload || !activeEntry()) return;
    const nodes = [renderSectionButtons(), renderEntryButtons(), renderQuickGuide()];
    const detail = renderExpandedDetail();
    if (detail) nodes.push(detail);
    root.replaceChildren(...nodes);
  }

  async function load() {
    if (destroyed) return;
    const token = ++loadToken;
    detailToken += 1;
    renderLoading();
    try {
      const response = await fetchImpl(indexUrl);
      if (!response.ok) throw new Error(`Guide request failed (${response.status})`);
      const next = await response.json();
      if (!isValidGuideIndex(next)) throw new Error("Unsupported guide index");
      if (destroyed || token !== loadToken) return;
      payload = next;
      section = next.sections[0];
      selectedId = next.entries.find(entry => entry.section === section).id;
      expanded = false;
      render();
    } catch {
      if (destroyed || token !== loadToken) return;
      renderLoadError();
    }
  }

  return {
    load,
    destroy() {
      destroyed = true;
      loadToken += 1;
      detailToken += 1;
      root.replaceChildren();
    }
  };
}

if (typeof document !== "undefined") {
  const root = document.querySelector("#immobilizationGuide");
  if (root) void createImmobilizationGuide({ root }).load();
}
