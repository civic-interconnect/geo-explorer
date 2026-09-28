// app/dropdowns/dropdown-06-precinct.js
import { DropdownControlGroup } from "../../components/DropdownControlGroup.js";
import { filterState } from "../filters/filter-state.js";

// Store the raw features
let currentRawFeatures = [];

/**
 * Renders the Precinct selection dropdown for highlighting a single precinct.
 * When a precinct is selected, it highlights it in red on the map.
 * @param {Array} rawFeatures - Raw feature data from map
 * @returns {void}
 */
export function renderPrecinctDropdown(rawFeatures) {
  const state = filterState.getState();

  // Update stored features if provided
  if (rawFeatures) {
    currentRawFeatures = rawFeatures;
  }

  // Filter features by selected county and subdist
  let filteredFeatures = currentRawFeatures;

  if (state.filters.county) {
    filteredFeatures = filteredFeatures.filter(
      (f) => f?.properties?.county === state.filters.county,
    );
  }

  if (state.filters.subdist) {
    filteredFeatures = filteredFeatures.filter((f) => {
      const mnHouse = f?.properties?.mn_house;
      if (!mnHouse) return false;

      const cleanValue = String(mnHouse).trim();
      const cleanFilter = String(state.filters.subdist).trim();

      // Exact match
      if (cleanValue === cleanFilter) return true;

      // Base number match (e.g., "3A" matches "3")
      if (
        cleanValue.startsWith(cleanFilter) &&
        /^[A-Za-z]+$/.test(cleanValue.slice(cleanFilter.length))
      ) {
        return true;
      }

      return false;
    });
  }

  // Extract unique precincts from the county/district-filtered features.
  const precincts = new Map();

  for (const feature of filteredFeatures) {
    const { precinct_id: id, precinct_name: name } = feature.properties || {};

    if (id != null) {
      precincts.set(String(id), name || String(id));
    }
  }

  const options = [
    { value: "", label: "Highlight Precinct..." },
    ...Array.from(precincts, ([value, label]) => ({
      value,
      label,
    })).sort((a, b) => a.label.localeCompare(b.label, "en", { numeric: true })),
  ];

  DropdownControlGroup({
    selectId: "precinct-select",
    labelText: "Highlight Precinct",
    options: options,
    value: state.highlight.type === "precinct" ? state.highlight.value : "",
    onChange: (newPrecinct) => {
      console.log("[dropdown-precinct] Precinct changed:", newPrecinct);

      if (newPrecinct) {
        // Set highlight (red outline)
        filterState.setHighlight("precinct", newPrecinct);
      } else {
        // Clear highlight
        filterState.clearHighlight();
      }
    },
  });
}
