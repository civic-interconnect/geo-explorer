// app/dropdown-01-view.js

import { DropdownControlGroup } from "../../components/DropdownControlGroup.js";
import { config } from "../../config.js";
import { appState } from "../../app-state.js";
import { render, loadSelectedLayer } from "../../index.js";
import { updateControlsVisibility } from "../mn-precinct-helpers.js";
import { filterState } from "../filters/filter-state.js";

/**
 * Render the dataset selection dropdown.
 * @returns {void}
 */
export function renderViewDropdown() {
  const views = Object.entries(config.groups).map(([key, group]) => ({
    value: key,
    label: group.label,
  }));

  DropdownControlGroup({
    selectId: "view-select",
    labelText: "Choose Dataset",
    options: views,
    value: appState.selectedView,

    onChange: (newView) => {
      const previousLayer = appState.selectedLayer;
      const layers = config.groups[newView]?.layers || {};

      appState.selectedView = newView;
      const filterViews = {
        "us-states": "state",
        "us-counties": "counties",
        "us-congress": "cds",
        "mn-precincts": "mn-precincts",
      };

      filterState.setView(filterViews[newView]);
      appState.selectedLayer =
        previousLayer && Object.hasOwn(layers, previousLayer)
          ? previousLayer
          : Object.keys(layers)[0] || null;

      appState.selectedFeature = null;
      appState.selectedCounty = null;
      appState.selectedSubdist = null;

      updateControlsVisibility(
        {
          featureContainer: document.getElementById("feature-container"),
          countyContainer: document.getElementById("county-container"),
          subdistContainer: document.getElementById("subdist-container"),
          countySelect: document.getElementById("county-select"),
          precinctContainer: document.getElementById("precinct-container"),
        },
        newView,
      );

      render();

      if (appState.selectedLayer) {
        loadSelectedLayer();
      }
    },
  });
}
