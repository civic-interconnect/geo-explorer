// app/dropdown-layer.js

import { sortByKey } from "https://civic-interconnect.github.io/app-core/utils/ui-utils.js";

import { DropdownControlGroup } from "../components/DropdownControlGroup.js";
import { config } from "../config.js";
import { appState } from "../app-state.js";
import { render , loadSelectedLayer} from "../index.js";

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
