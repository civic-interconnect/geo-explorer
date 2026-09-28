// app/dropdowns/dropdown-04-county.js
import { DropdownControlGroup } from "../../components/DropdownControlGroup.js";
import { filterState } from "../filters/filter-state.js";
import { renderSubdistrictDropdown } from "./dropdown-05-subdist.js";
import { renderPrecinctDropdown } from "./dropdown-06-precinct.js";
// Store the raw features
let currentRawFeatures = [];

/**
 * Ensures the county dropdown container exists.
 * @returns {HTMLElement} The county dropdown container element.
 */
function ensureContainer() {
  if (typeof document === "undefined") {
    return null;
  }
  let el = document.getElementById("county-dropdown");
  if (!el) {
    el = document.createElement("div");
    el.id = "county-dropdown";
    const controlsElement = document.querySelector("#controls");
    if (controlsElement) {
      controlsElement.appendChild(el);
    }
  }
  return el;
}

/**
 * Renders the County selection dropdown.
 * When the county changes, it updates the filter state.
 * @param {Array} rawFeatures - Raw feature data from map
 * @returns {void}
 */
export function renderCountyDropdown(rawFeatures) {
  const container = ensureContainer();
  if (!container) {
    console.error("[dropdown-county] County container not found!");
    return;
  }

  const state = filterState.getState();

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

  // Extract unique counties from raw features
  const counties = Array.from(
    new Set(
      currentRawFeatures
        .map((f) => f?.properties?.county)
        .filter((v) => typeof v === "string" && v.length > 0)
    )
  ).sort();

  console.log("[dropdown-county] Available counties:", counties);

  const options = [
    { value: "", label: "All Counties" },
    ...counties.map((c) => ({ value: c, label: c })),
  ];

  DropdownControlGroup({
    selectId: "county-select",
    labelText: "Filter by County",
    options: options,
    value: state.filters.county || "",
    onChange: (newCounty) => {
      console.log("[dropdown-county] County changed:", newCounty);
      filterState.setFilter("county", newCounty || null);

      // TRIGGER SUBDIST DROPDOWN RE-RENDER
      renderSubdistrictDropdown(currentRawFeatures);
      renderPrecinctDropdown(currentRawFeatures);
    },
  });
}
