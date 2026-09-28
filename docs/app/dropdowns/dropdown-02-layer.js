// app/dropdown-02-layer.js

import { sortByKey } from "https://civic-interconnect.github.io/app-core/utils/ui-utils.js";

import { DropdownControlGroup } from "../../components/DropdownControlGroup.js";
import { config } from "../../config.js";
import { appState } from "../../app-state.js";
import { render } from "../../index.js";
import { filterState } from "../filters/filter-state.js";
import { refs } from "../../ui/dom-refs.js";

/**
 * Renders the Layer (US State) selection dropdown.
 * When the layer changes, it updates the app state,
 * resets the selected feature as needed,
 * and triggers a re-render of the UI.
 * @returns {void}
 */
export function renderLayerDropdown() {
  const group = config.groups[appState.selectedView];
  if (!group?.layers) {
    console.warn("[app.js] No layers found for view:", appState.selectedView);
    return;
  }

  let layers = Object.entries(group.layers).map(([key, layer]) => ({
    value: key,
    label: layer.label,
  }));

  // Enforce invariant in UI: in MN Precincts, only "minnesota" is valid
  if (appState.selectedView === "mn-precincts") {
    layers = layers.filter((o) => o.value === "minnesota");
    if (appState.selectedLayer !== "minnesota" && group.layers.minnesota) {
      appState.selectedLayer = "minnesota";
    }
  }

  DropdownControlGroup({
    selectId: "layer-select",
    labelText: "Choose State",
    options: sortByKey(layers),
    value: appState.selectedLayer,
    onChange: (newLayer) => {
      console.log("[dropdown-02-layer] Layer changed:", newLayer);
      // If precincts view, ignore attempts to change away from Minnesota
      appState.selectedLayer =
        appState.selectedView === "mn-precincts" ? "minnesota" : newLayer;

      // If we're on the states view, highlight the selected state
      const view = filterState.getState().view;
      if (view === "state" && newLayer) {
        filterState.setHighlight("state", newLayer);
      } else {
        filterState.clearHighlight();
      }

      // Load the chosen layer directly
      const group = config.groups[appState.selectedView];
      const layer = group?.layers?.[newLayer];
      const mv = refs.mapViewer();

      if (layer && mv?.loadLayer) mv.loadLayer(layer, { skipFitBounds: false });

      render();
    },
  });
}
