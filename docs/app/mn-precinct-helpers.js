// app/mn-precinct-helpers.js
import { appState } from "../app-state.js";

/** Populate county dropdown ONLY for MN Precincts view */
export function populateMNPrecinctCounties() {
  const countySelect = document.getElementById("county-select");
  if (!countySelect) return;

  countySelect.innerHTML = "<option disabled selected>[ Select a County ]</option>";
}

/** Update county options from loaded features (if available) */
export function updateCountyOptions(rawFeatures) {
  const countySelect = document.getElementById("county-select");
  if (!countySelect) return;

  const counties = Array.from(
    new Set(
      (rawFeatures || [])
        .map((f) => f?.properties?.county)
        .filter(Boolean)
        .map((s) => String(s).trim())
    )
  ).sort();

  countySelect.innerHTML =
    "<option disabled selected>[ Select a County ]</option>" +
    counties.map((c) => `<option value="${c}">${c}</option>`).join("");
}

/** Show/hide MN Precinct controls based on current view */
export function updatePrecinctControlsVisibility() {
  const countyContainer = document.getElementById("county-container");
  const subdistContainer = document.getElementById("subdist-container");
  const countySelect = document.getElementById("county-select");

  const isMNPrecinctView = appState.selectedView === "mn-precincts";

  if (countyContainer) countyContainer.style.display = isMNPrecinctView ? "flex" : "none";
  if (subdistContainer) subdistContainer.style.display = isMNPrecinctView ? "flex" : "none";

  // Only populate county dropdown when entering MN Precincts view
  if (isMNPrecinctView && countySelect && countySelect.options.length <= 1) {
    populateMNPrecinctCounties();
  }
}
