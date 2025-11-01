// controllers/mn-precincts-controller.js

import { appState } from "../app-state.js";
import { getCurrentRawFeatures } from "../map/map-viewer-bridge.js";
import { renderSubdistrictDropdown } from "../app/dropdown-05-subdist.js";

/**
 * Wires up the MN precincts controller.
 * @param {Object} param0
 * @param {Object} param0.refs - Reference to DOM elements.
 * @param {Object} param0.mapViewer - Reference to the map viewer instance.
 */
export function wireMNPrecinctsController({ refs, mapViewer }) {
  // County change (MN only)
  document.addEventListener("change", (e) => {
    const el = e.target && e.target.closest && e.target.closest("#county-select");
    if (!el) return;
    if (appState.selectedView !== "mn-precincts") return;

    const county = el.value;
    appState.selectedCounty = county;
    appState.selectedSubdist = null;

    renderSubdistrictDropdown(getCurrentRawFeatures());

    if (mapViewer) {
      mapViewer.dispatchEvent(
        new CustomEvent("apply-precinct-filter", {
          detail: { county, subdist: null },
          bubbles: true,
          composed: true
        })
      );
    }
  });

  // Subdistrict change (MN only)
  document.addEventListener("change", (e) => {
    const el = e.target && e.target.closest && e.target.closest("#subdist-select");
    if (!el) return;
    if (appState.selectedView !== "mn-precincts") return;

    const subdist = el.value;
    const countySelect = refs.countySelect && refs.countySelect();
    const countyVal = countySelect ? countySelect.value : null;

    if (mapViewer) {
      mapViewer.dispatchEvent(
        new CustomEvent("apply-precinct-filter", {
          detail: { county: countyVal || null, subdist },
          bubbles: true,
          composed: true
        })
      );
    }
  });
}
