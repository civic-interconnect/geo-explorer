// index.js
// This file serves as the main entry point for the GeoExplorer application.

import "https://civic-interconnect.github.io/app-core/components/ci-header/ci-header.js";
import "https://civic-interconnect.github.io/app-core/components/ci-footer/ci-footer.js";
import "https://civic-interconnect.github.io/app-core/components/ci-theme-toggle/ci-theme-toggle.js";
import { patchFooterStatus } from "https://civic-interconnect.github.io/app-core/index-init.js";

import { appState } from "./app-state.js";
import { config } from "./config.js";
import { generateStateLayers } from "./app/layer-states.js";
import { generateCountyLayers } from "./app/layer-counties.js";
import { generateCD118Layers } from "./app/layer-cd118.js";
import { renderFeatureDropdown } from "./app/dropdown-03-feature.js";
import { renderLayerDropdown } from "./app/dropdown-02-layer.js";
import { renderViewDropdown } from "./app/dropdown-01-view.js";
import { featureData } from "./app/store-feature.js";
import "./app/map-viewer.js";
console.log("GeoExplorer app initialized");

// ---------- DATA ----------

if (config.groups["us-states"]) {
  config.groups["us-states"].layers = generateStateLayers();
}
if (config.groups["us-counties"]) {
  config.groups["us-counties"].layers = generateCountyLayers();
}
if (config.groups["us-congress"]) {
  config.groups["us-congress"].layers = generateCD118Layers();
}


// ---------- LOAD SELECTED LAYER AND RENDER ----------

export function loadSelectedLayer() {
  const group = config.groups[appState.selectedView];
  const layerKey = appState.selectedLayer;
  const layer = group?.layers?.[layerKey];

  if (layer) {
    const mapViewer = document.querySelector("map-viewer");
    mapViewer.loadLayer(layer, { skipFitBounds: false });
  } else {
    console.warn("[app.js] No layer to load for current app state.");
  }
}

export function render() {
  console.log("[app.js] RENDER START. App state:", appState);
  renderViewDropdown();
  renderLayerDropdown();
  renderFeatureDropdown();
  console.log("[app.js] RENDER COMPLETE. App state:", appState);
}

// ---------- EVENTS ----------

document.addEventListener("DOMContentLoaded", () => {
  console.log("[app.js] DOMContentLoaded fired");

  appState.selectedView = "us-states";
  appState.selectedLayer = "minnesota";
  appState.selectedFeature = null;

  console.log("[app.js] Initialized with States / Minnesota.");

  render();
  requestAnimationFrame(() => {
    loadSelectedLayer();
  });

  const mapViewer = document.querySelector("map-viewer");
  if (!mapViewer) {
    console.error("[app.js] ERROR: <map-viewer> element not found in DOM!");
    return;
  } else {
    console.log("[app.js] <map-viewer> found.");
  }

  mapViewer.addEventListener("features-loaded", (e) => {
    console.log("[app.js] features-loaded event fired:", e.detail);

    const features = e.detail.features;
    const layerKey = appState.selectedLayer;

    console.log("[app.js] Current selectedLayer:", layerKey);
    console.log("[app.js] Features received:", features);

    if (features.length > 1 && layerKey) {
      featureData[layerKey] = features;
      console.log(
        "[app.js] Saved features to featureData for layer:",
        layerKey
      );
    } else if (layerKey) {
      featureData[layerKey] = [];
      console.log("[app.js] No features for this layer. Stored empty array.");
    }

    render();
    console.log("[app.js] Re-rendered after features-loaded.");
  });

  patchFooterStatus("./VERSION");
  console.log("[app.js] Footer status patch requested.");
});
