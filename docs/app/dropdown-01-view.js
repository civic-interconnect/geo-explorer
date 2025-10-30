// app/dropdown-view.js

import { DropdownControlGroup } from "../components/DropdownControlGroup.js";
import { config } from "../config.js";
import { appState } from "../app-state.js";
import { render } from "../index.js";
import { loadSelectedLayer } from "../map/map-viewer-bridge.js";

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
      console.log("[dropdown-view.js] View changed to:", newView);

      const previousLayer = appState.selectedLayer;
      appState.selectedView = newView;
      appState.selectedFeature = null;

      const newGroup = config.groups[newView];
      if (newGroup?.layers?.[previousLayer]) {
        appState.selectedLayer = previousLayer;
        loadSelectedLayer();
      } else {
        appState.selectedLayer = null;
      }

      render();

      if (appState.selectedLayer) {
        loadSelectedLayer();
      }
    },
  });
}
