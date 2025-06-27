// ui-utils.js

export function populateViews(config, viewSelect) {
  for (const [groupKey, group] of Object.entries(config.groups)) {
    const opt = document.createElement("option");
    opt.value = groupKey;
    opt.textContent = group.label;
    viewSelect.appendChild(opt);
  }
}

export function createSlotSpan(name, value = "—") {
  const span = document.createElement("span");
  span.setAttribute("slot", name);
  span.textContent = value;
  return span;
}
