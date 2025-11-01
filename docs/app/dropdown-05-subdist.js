// app/dropdown-05-subdist.js
import { appState } from "../app-state.js";
import { featureData } from "./store-feature.js";

import { render } from "../index.js";
import { DropdownControlGroup } from "../components/DropdownControlGroup.js";
import { sortByKey } from "https://civic-interconnect.github.io/app-core/utils/ui-utils.js";

// Store the raw features
let currentRawFeatures = [];


/**
 * Renders the Sub-district selection dropdown.
 * When the sub-district changes, it updates the app state,
 * and triggers a re-render of the UI.
 * @param {*} rawFeatures
 * @returns {void}
 */
export function renderSubdistrictDropdown(rawFeatures) {
  const container = document.getElementById("subdist-container");
  if (!container) return;

  // Only show for MN Precincts view
  if (appState.selectedView !== "mn-precincts") {
    container.style.display = "none";
    return;
  }

  container.style.display = "flex";

  // Update stored features if provided
  if (rawFeatures) {
    currentRawFeatures = rawFeatures;
  }

  // Filter features by selected county
  let filteredFeatures = currentRawFeatures;
  if (appState.selectedCounty) {
    filteredFeatures = currentRawFeatures.filter(
      (f) => f?.properties?.county === appState.selectedCounty
    );
  }

  // Extract unique sub-districts from filtered features
  const subdistricts = Array.from(
    new Set(
      filteredFeatures
        .map((f) => f?.properties?.mn_house)
        .filter(Boolean)
        .map((s) => String(s).trim())
    )
  ).sort((a, b) => a.localeCompare(b, "en", { numeric: true }));

  // Create options array
  const options = [
    { value: "", label: "All Sub-districts" },
    ...subdistricts.map((s) => ({ value: s, label: s })),
  ];

  DropdownControlGroup({
    selectId: "subdist-select",
    labelText: "Choose Sub-district",
    options: options,
    value: appState.selectedSubdist || "",
    onChange: (newSubdist) => {
      console.log("[dropdown-subdist.js] Sub-district changed:", newSubdist);
      appState.selectedSubdist = newSubdist || null;

      // Apply filter to map
      const mapViewer = document.querySelector("map-viewer");
      if (mapViewer) {
        mapViewer.dispatchEvent(
          new CustomEvent("apply-precinct-filter", {
            detail: {
              county: appState.selectedCounty,
              subdist: newSubdist || null,
            },
            bubbles: true,
            composed: true,
          })
        );
      }

      render();
    },
  });
}
