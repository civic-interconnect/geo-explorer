// app/dropdown-layer.js

import { sortByKey } from "https://civic-interconnect.github.io/app-core/utils/ui-utils.js";

import { DropdownControlGroup } from "../components/DropdownControlGroup.js";
import { config } from "../config.js";
import { appState } from "../app-state.js";
import { render } from "../index.js";
import { loadSelectedLayer } from "../map/map-viewer-bridge.js";


/**
 * Renders the Layer selection dropdown.
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

  const layers = Object.entries(group.layers).map(([key, layer]) => ({
    value: key,
    label: layer.label,
  }));

  DropdownControlGroup({
    selectId: "layer-select",
    labelText: "Choose State",
    options: sortByKey(layers),
    value: appState.selectedLayer,
    onChange: (newLayer) => {
      console.log("[app.js] Layer changed:", newLayer);
      appState.selectedLayer = newLayer;
      appState.selectedFeature = null;
      loadSelectedLayer();
      render();
    },
  });
}
