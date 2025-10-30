// controllers/view-controller.js
import { appState } from "../app-state.js";
import {
  populateMNPrecinctCounties,
  updatePrecinctControlsVisibility,
} from "../app/mn-precinct-helpers.js";

export function wireViewController({ refs, render }) {
  const viewSelect = refs.viewSelect();
  const countyContainer = refs.countyContainer();
  const subdistContainer = refs.subdistContainer();

  if (!viewSelect) return;

  // Initial visibility check
  updatePrecinctControlsVisibility();

  viewSelect.addEventListener("change", () => {
    const selectedView = viewSelect.value;
    appState.selectedView = selectedView;

    // Control dropdown visibility
    if (selectedView === "mn-precincts") {
      // SHOW for MN Precincts only
      updatePrecinctControlsVisibility();
      populateMNPrecinctCounties();
    } else {
      // HIDE for all other views
      updatePrecinctControlsVisibility();
    }

    render();
  });
}
