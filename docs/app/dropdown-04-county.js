// app/dropdown-04-county.js
import { appState } from "../app-state.js";
import { featureData } from "./store-feature.js";
import { loadSelectedLayer, render } from "../index.js";

function ensureContainer() {
  let el = document.getElementById("county-dropdown");
  if (!el) {
    el = document.createElement("div");
    el.id = "county-dropdown";
    document.querySelector("#controls")?.appendChild(el);
  }
  return el;
}

export function renderCountyDropdown() {
  const el = ensureContainer();

  // Only show for the MN Precincts view
  if (appState.selectedView !== "mn-precincts") {
    el.innerHTML = "";
    return;
  }

  const layerKey = appState.selectedLayer;
  const feats = (layerKey && featureData[layerKey]) || [];
  console.log("[dropdown-04-county] Features for layer", layerKey, feats);

  // Build unique county list
  const counties = Array.from(
    new Set(
      feats
        .map(f => f?.properties?.County)
        .filter(v => typeof v === "string" && v.length > 0)
    )
  ).sort();

  const current = appState.selectedCounty || "";

  el.innerHTML = `
    <label>County</label>
    <select id="county-select">
      <option value="">All counties</option>
      ${counties.map(c => `<option value="${c}" ${c === current ? "selected" : ""}>${c}</option>`).join("")}
    </select>
  `;

  el.querySelector("#county-select").addEventListener("change", (e) => {
    appState.selectedCounty = e.target.value || null;
    // Re-render downstream dropdowns and re-apply filter
    render();
    // Re-apply filter to the map (if precinct layer is active)
    document.querySelector("map-viewer")?.dispatchEvent(new CustomEvent("apply-precinct-filter"));
  });
}
