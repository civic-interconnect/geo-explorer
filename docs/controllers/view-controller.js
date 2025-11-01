// controllers/view-controller.js

import { appState } from "../app-state.js";
import {
  populateMNPrecinctCounties,
  updateControlsVisibility,
} from "../app/mn-precinct-helpers.js";


/**
 * Wires up the view controller.
 * @param {Object} param0
 * @param {Object} param0.refs - Reference to DOM elements.
 * @param {Function} param0.render - Render function.
 * @returns {void}
 */
export function wireViewController({ refs, render }) {
  const viewSelect = refs.viewSelect();
  if (!viewSelect) return;

  updateControlsVisibility();

  viewSelect.addEventListener("change", () => {
    const selectedView = viewSelect.value;
    appState.selectedView = selectedView;

    // Control dropdown visibility
    if (selectedView === "mn-precincts") {
      // SHOW for MN Precincts only
      updateControlsVisibility();
      populateMNPrecinctCounties();
    } else {
      // HIDE for all other views
      updateControlsVisibility();
    }

    render();
  });
}
