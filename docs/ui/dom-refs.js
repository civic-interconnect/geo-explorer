// ui/dom-refs.js
export const refs = {
  // Dropdowns
  viewSelect: () => document.getElementById("view-select"),
  layerSelect: () => document.getElementById("layer-select"),
  featureSelect: () => document.getElementById("feature-select"),
  countySelect: () => document.getElementById("county-select"),
  subdistSelect: () => document.getElementById("subdist-select"),
  
  // Containers
  featureContainer: () => document.getElementById("feature-container"),
  countyContainer: () => document.getElementById("county-container"),
  subdistContainer: () => document.getElementById("subdist-container"),
  
  // Map component
  mapViewer: () => document.querySelector("map-viewer"),
  
  // Other controls (if needed)
  layerToggles: () => document.getElementById("layer-toggles"),
  controls: () => document.getElementById("controls")
};

// Verification function to check DOM elements (call after DOMContentLoaded)
export function verifyRefs() {
  const results = {};
  for (const [key, getRef] of Object.entries(refs)) {
    const el = getRef();
    results[key] = !!el;
    if (!el) {
      console.warn(`[DOM Refs] Element not found: ${key}`);
    }
  }
  console.log("[DOM Refs] Verification complete:", results);
  return results;
}