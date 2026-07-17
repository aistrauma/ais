const STORAGE_KEY = "aisTqipOpenSections";

const slugify = text => text.toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

export function initTqipAccordions(root, storage = sessionStorage) {
  const details = [...root.querySelectorAll("details.card")];
  const status = root.querySelector("#tqipState");
  const listeners = [];

  for (const item of details) {
    const summary = item.querySelector("summary");
    item.dataset.tqipId ||= slugify(summary.textContent);

    let content = item.querySelector(":scope > .tqip-section-content");
    if (!content) {
      content = root.ownerDocument.createElement("div");
      content.className = "tqip-section-content";
      [...item.children]
        .filter(child => child !== summary)
        .forEach(child => content.append(child));
      item.append(content);
    }

    content.id = `${item.dataset.tqipId}-content`;
    summary.setAttribute("aria-controls", content.id);
  }

  let restored = [];
  try {
    restored = JSON.parse(storage.getItem(STORAGE_KEY) || "[]");
  } catch {
    restored = [];
  }
  details.forEach(item => { item.open = restored.includes(item.dataset.tqipId); });

  const persist = () => {
    const open = details.filter(item => item.open).map(item => item.dataset.tqipId);
    details.forEach(item => {
      item.querySelector("summary").setAttribute("aria-expanded", String(item.open));
    });
    storage.setItem(STORAGE_KEY, JSON.stringify(open));
    if (status) status.textContent = `${open.length} of ${details.length} sections expanded`;
  };

  for (const item of details) {
    const handler = persist;
    item.addEventListener("toggle", handler);
    listeners.push([item, "toggle", handler]);
  }

  const setAll = open => {
    details.forEach(item => { item.open = open; });
    persist();
  };
  const expandAll = () => setAll(true);
  const collapseAll = () => setAll(false);

  const expandButton = root.querySelector("#tqipExpandAll");
  const collapseButton = root.querySelector("#tqipCollapseAll");
  if (expandButton) {
    expandButton.addEventListener("click", expandAll);
    listeners.push([expandButton, "click", expandAll]);
  }
  if (collapseButton) {
    collapseButton.addEventListener("click", collapseAll);
    listeners.push([collapseButton, "click", collapseAll]);
  }

  persist();
  return {
    expandAll,
    collapseAll,
    destroy() {
      listeners.forEach(([element, event, handler]) => element.removeEventListener(event, handler));
    }
  };
}

if (typeof document !== "undefined") {
  const root = document.querySelector("#viewTQIP");
  if (root) initTqipAccordions(root);
}
