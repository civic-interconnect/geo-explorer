// app/dropdown-05-subdist.js
import { appState } from "../app-state.js";
import { featureData } from "./store-feature.js";
import { render } from "../index.js";

function ensureContainer() {
  let el = document.getElementById("subdist-dropdown");
  if (!el) {
    el = document.createElement("div");
    el.id = "subdist-dropdown";
    document.querySelector("#controls")?.appendChild(el);
  }
  return el;
}

export function renderSubdistrictDropdown() {
  const el = ensureContainer();

  if (appState.selectedView !== "mn-precincts") {
    el.innerHTML = "";
    return;
  }

  const layerKey = appState.selectedLayer;
  const feats = (layerKey && featureData[layerKey]) || [];

  // MN House sub-district like "03A", "03B"
  const subs = Array.from(
    new Set(
      feats
        .map(f => f?.properties?.MNLegDist)
        .filter(v => typeof v === "string" && v.length > 0)
    )
  )
  .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));

  const current = appState.selectedSubdist || "";

  el.innerHTML = `
    <label>MN House (e.g., 03A/03B)</label>
    <select id="subdist-select">
      <option value="">All sub-districts</option>
      ${subs.map(s => `<option value="${s}" ${s === current ? "selected" : ""}>${s}</option>`).join("")}
    </select>
  `;

  el.querySelector("#subdist-select").addEventListener("change", (e) => {
    appState.selectedSubdist = e.target.value || null;
    render();
    document.querySelector("map-viewer")?.dispatchEvent(new CustomEvent("apply-precinct-filter"));
  });
}
