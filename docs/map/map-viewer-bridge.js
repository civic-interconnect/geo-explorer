// map/map-viewer-bridge.js
import { appState } from "../app-state.js";
import { config } from "../config.js";
import { featureData } from "../app/store-feature.js"; // use your original store
import { renderViewDropdown } from "../app/dropdown-01-view.js";
import { renderLayerDropdown } from "../app/dropdown-02-layer.js";
import { renderFeatureDropdown } from "../app/dropdown-03-feature.js";
import { renderCountyDropdown } from "../app/dropdown-04-county.js";
import { renderSubdistrictDropdown } from "../app/dropdown-05-subdist.js";

let currentRawFeatures = [];

/**
 * Set up the map bridge by initializing the map viewer and setting up event listeners.
 * @param {Object} param0.refs - Reference to DOM elements.
 * @param {Function} param0.render - Render function.
 * @returns {Promise<HTMLElement|null>} The map viewer element or null if not found.
 */
export async function setupMapBridge({  }) {
  await customElements.whenDefined("map-viewer");
  const mapViewer = document.querySelector("map-viewer");
  if (!mapViewer) {
    console.error("[map] <map-viewer> not found");
    return null;
  }

  mapViewer.addEventListener("features-loaded", (e) => {
    const features = (e.detail && e.detail.features) || [];
    const raw = (e.detail && e.detail.rawFeatures) || [];
    const layerKey = appState.selectedLayer || "";

    currentRawFeatures = raw;

    if (features.length > 1 && layerKey) {
      featureData[layerKey] = features;
    } else if (layerKey) {
      featureData[layerKey] = [];
    }

    if (appState.selectedView === "mn-precincts") {
      const countySelect = document.getElementById("county-select");
      if (countySelect) {
        const counties = Array.from(
          new Set((raw || [])
            .map(f => f?.properties?.county)
            .filter(Boolean)
            .map(s => String(s).trim()))
        ).sort();
        countySelect.innerHTML =
          "<option disabled selected>[ Select a County ]</option>" +
          counties.map(c => `<option value="${c}">${c}</option>`).join("");
      }
    }

    renderViewDropdown();
    renderLayerDropdown();
    renderFeatureDropdown();
    renderCountyDropdown();
    renderSubdistrictDropdown(raw);
  });

  return mapViewer;
}

export async function loadSelectedLayer(mapViewer) {
  await customElements.whenDefined("map-viewer");
  const el = mapViewer || document.querySelector("map-viewer");
  const group = config.groups[appState.selectedView];
  const layer = group && group.layers && group.layers[appState.selectedLayer];
  if (!el || typeof el.loadLayer !== "function" || !layer) return;
  el.loadLayer(layer, { skipFitBounds: false });
}

export function getCurrentRawFeatures() {
  return currentRawFeatures;
}
