// app/dropdown-view.js

import { DropdownControlGroup } from "../components/DropdownControlGroup.js";
import { config } from "../config.js";
import { appState } from "../app-state.js";
import { render } from "../index.js";
import { loadSelectedLayer } from "../map/map-viewer-bridge.js";

/**
 * Renders the View selection dropdown.
 * When the view changes, it updates the app state,
 * resets the selected layer and feature as needed,
 * and triggers a re-render of the UI.
 * @param {void}
 */
export function renderViewDropdown() {
  const views = Object.entries(config.groups).map(([key, group]) => ({
    value: key,
    label: group.label,
  }));


  /** View selection dropdown */
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
