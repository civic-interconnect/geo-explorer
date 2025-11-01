// index.js
// Main entry point for GeoExplorer app

import { refs, verifyRefs } from "./ui/dom-refs.js";
import { extractCounties, buildCountyOptions } from "./helpers/options.js";
import { updateCountyOptions } from "./app/update-county-options.js";
import {
  handleViewChange,
  handleCountyChange,
  handleSubdistChange,
  handleFeaturesLoaded,
  updateControlsVisibility,
} from "./app/mn-precinct-helpers.js";

import "./components/ci-header/ci-header.js";
import "./components/ci-footer/ci-footer.js";
import "./components/ci-theme-toggle/ci-theme-toggle.js";
import { patchFooterStatus } from "https://civic-interconnect.github.io/app-core/index-init.js";

import { appState } from "./app-state.js";
import { config } from "./config.js";
import { generateStateLayers } from "./app/layer-states.js";
import { generateCountyLayers } from "./app/layer-counties.js";
import { generateCD118Layers } from "./app/layer-cd118.js";
import { generateMNPrecinctLayers } from "./app/layer-mn-precincts.js";

import { renderSubdistrictDropdown } from "./app/dropdown-05-subdist.js";
import { renderCountyDropdown } from "./app/dropdown-04-county.js";
import { renderFeatureDropdown } from "./app/dropdown-03-feature.js";
import { renderLayerDropdown } from "./app/dropdown-02-layer.js";
import { renderViewDropdown } from "./app/dropdown-01-view.js";

import { featureData } from "./app/store-feature.js";

// --- DEFINE CUSTOM ELEMENT AFTER OTHER IMPORTS ---
import "./app/map-viewer.js";

console.log("GeoExplorer app initialized");

// ---------- DATA (populate before render) ----------
config.groups["us-states"].layers = generateStateLayers();
config.groups["us-counties"].layers = generateCountyLayers();
config.groups["us-congress"].layers = generateCD118Layers();
config.groups["mn-precincts"].layers = generateMNPrecinctLayers();

// ---------- LOAD SELECTED LAYER AND RENDER ----------
export function loadSelectedLayer() {
  const group = config.groups[appState.selectedView];
  const layerKey = appState.selectedLayer;
  const layer = group?.layers?.[layerKey];

  console.log(
    "[DEBUG] loadSelectedLayer: view=%s layerKey=%s layer? %s",
    appState.selectedView,
    layerKey,
    Boolean(layer)
  );

  if (layer) {
    const mapViewer = document.querySelector("map-viewer");
    mapViewer.loadLayer(layer, { skipFitBounds: false });
    console.log("[DEBUG] loadSelectedLayer: invoked mapViewer.loadLayer()");
  } else {
    console.warn("[app.js] No layer to load for current app state.");
  }
}

export function render() {
  console.log(
    "[DEBUG] RENDER START. appState:",
    JSON.parse(JSON.stringify(appState))
  );
  renderViewDropdown();
  renderLayerDropdown();
  renderFeatureDropdown();
  renderCountyDropdown();
  renderSubdistrictDropdown();
  console.log(
    "[DEBUG] RENDER COMPLETE. appState:",
    JSON.parse(JSON.stringify(appState))
  );
}

// ---------- DOM CONTENT LOADED ----------

document.addEventListener("DOMContentLoaded", function initializeApp() {
  console.log("[DEBUG] DOMContentLoaded fired");
  verifyRefs();
  const elements = {
    viewSelect: refs.viewSelect(),
    layerSelect: refs.layerSelect(),
    featureSelect: refs.featureSelect(),
    countySelect: refs.countySelect(),
    subdistSelect: refs.subdistSelect(),
    mapViewer: refs.mapViewer(),
  };

  const containers = {
    featureContainer: refs.featureContainer(),
    countyContainer: refs.countyContainer(),
    subdistContainer: refs.subdistContainer(),
    countySelect: elements.countySelect,
  };

  // Module-scoped state
  let currentRawFeatures = [];

  // Create dependency bundle for handlers
  const createDependencies = () => ({
    appState,
    containers,
    mapViewer: elements.mapViewer,
    currentRawFeatures,
    featureData,
    render,
    loadSelectedLayer,
    renderSubdistrictDropdown,
    updateCountyOptionsFn: (raw) =>
      updateCountyOptions(
        elements.countySelect,
        raw,
        extractCounties,
        buildCountyOptions
      ),
  });

  // Initialize app state
  function initializeState() {
    appState.selectedView = "us-states";
    appState.selectedLayer = "minnesota";
    appState.selectedFeature = null;

    console.log(
      "[DEBUG] INIT: defaults set {view:%s, layer:%s, feature:%s}",
      appState.selectedView,
      appState.selectedLayer,
      String(appState.selectedFeature)
    );
  }

  // Attach event listeners with dependency injection
  function attachEventListeners() {
    // View change handler
    elements.viewSelect.addEventListener(
      "change",
      function onViewChange(event) {
        handleViewChange(event.target.value, createDependencies());
      }
    );

    // County change handler
    if (elements.countySelect) {
      elements.countySelect.addEventListener(
        "change",
        function onCountyChange(event) {
          handleCountyChange(event.target.value, createDependencies());
        }
      );
    }

    // Subdistrict change handler
    if (elements.subdistSelect) {
      elements.subdistSelect.addEventListener(
        "change",
        function onSubdistChange(event) {
          handleSubdistChange(event.target.value, {
            ...createDependencies(),
            countySelect: elements.countySelect,
          });
        }
      );
    }

    // Features loaded handler
    if (elements.mapViewer) {
      elements.mapViewer.addEventListener(
        "features-loaded",
        function onFeaturesLoaded(event) {
          currentRawFeatures = handleFeaturesLoaded(
            event.detail,
            createDependencies()
          );
        }
      );
    }
  }

  // Initialize the application
  function initialize() {
    initializeState();
    render();
    updateControlsVisibility(containers, appState.selectedView);
    requestAnimationFrame(() => loadSelectedLayer());
    patchFooterStatus("./VERSION");
  }

  // Bootstrap the app
  attachEventListeners();
  initialize();

  console.log("[DEBUG] App initialization complete");
});
