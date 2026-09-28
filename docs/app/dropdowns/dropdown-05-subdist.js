// app/dropdowns/dropdown-05-subdist.js
import { DropdownControlGroup } from "../../components/DropdownControlGroup.js";
import { filterState } from "../filters/filter-state.js";
import { renderPrecinctDropdown } from "./dropdown-06-precinct.js";

// Store the raw features
let currentRawFeatures = [];

/**
 * Renders the Sub-district selection dropdown.
 * When the sub-district changes, it updates the filter state.
 * @param {Array} rawFeatures - Raw feature data from map
 * @returns {void}
 */
export function renderSubdistrictDropdown(rawFeatures) {
  const container = document.getElementById("subdist-container");
  if (!container) return;

  const state = filterState.getState();
  console.log(
    "[dropdown-subdist] Rendering. View:",
    state.view,
    "County:",
    state.filters.county
  );

  // Only show for MN Precincts view
  if (state.view !== "mn-precincts") {
    container.style.display = "none";
    return;
  }

  container.style.display = "flex";

  // Update stored features if provided
  if (rawFeatures) {
    currentRawFeatures = rawFeatures;
  }

  // Filter features by selected county (from Filter State)
  let filteredFeatures = currentRawFeatures;
  if (state.filters.county) {
    filteredFeatures = currentRawFeatures.filter(
      (f) => f?.properties?.county === state.filters.county
    );
  }

  console.log("[dropdown-subdist] Total features:", currentRawFeatures.length);
  console.log("[dropdown-subdist] Filtered features:", filteredFeatures.length);

  // Extract unique sub-districts from filtered features
  const subdistricts = Array.from(
    new Set(
      filteredFeatures
        .map((f) => f?.properties?.mn_house)
        .filter(Boolean)
        .map((s) => String(s).trim())
    )
  ).sort((a, b) => a.localeCompare(b, "en", { numeric: true }));

  console.log("[dropdown-subdist] Available subdistricts:", subdistricts);

  // Extract base numbers (e.g., "3" from "3A", "3B")
  const baseNumbers = Array.from(
    new Set(
      subdistricts.map((s) => s.replace(/[A-Za-z]+$/, "")) // Remove trailing letters
    )
  ).filter((s) => s.length > 0); // Remove empty strings

  // Combine and deduplicate
  const allOptions = Array.from(
    new Set([...baseNumbers, ...subdistricts])
  ).sort((a, b) => a.localeCompare(b, "en", { numeric: true }));

  // Create options array
  const options = [
    { value: "", label: "All Sub-districts" },
    ...allOptions.map((s) => ({ value: s, label: s })),
  ];

  DropdownControlGroup({
    selectId: "subdist-select",
    labelText: "Filter by Sub-district",
    options: options,
    value: state.filters.subdist || "",
    onChange: (newSubdist) => {
      console.log("[dropdown-subdist] Subdist changed:", newSubdist);
      filterState.setFilter("subdist", newSubdist || null);

      // Trigger precinct dropdown update
      setTimeout(() => {
        renderPrecinctDropdown(currentRawFeatures);
      }, 0);
    },
  });
}
