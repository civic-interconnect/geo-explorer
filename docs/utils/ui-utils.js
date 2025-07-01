// utils/ui-utils.js

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

/**
 * Sorts an array of objects alphabetically by the given key.
 *
 * @param {Array} array - Array of objects
 * @param {string} key - The object property to sort by
 * @returns {Array}
 */
export function sortByKey(array, key = "label") {
  return array.slice().sort((a, b) => {
    const aVal = a[key] || "";
    const bVal = b[key] || "";
    return aVal.localeCompare(bVal);
  });
}

export function highlightFeature(featureId) {
  const mapViewer = document.querySelector("map-viewer");
  if (featureId) {
    mapViewer.highlightFeature(featureId, { skipZoom: true });
  }
}
