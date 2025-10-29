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
import { generateMNPrecinctLayers } from "./app/layer-mn-precincts.js";
import { renderFeatureDropdown } from "./app/dropdown-03-feature.js";
import { renderLayerDropdown } from "./app/dropdown-02-layer.js";
import { renderViewDropdown } from "./app/dropdown-01-view.js";
import { featureData } from "./app/store-feature.js";
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

  // --- GET DOM ELEMENTS ---
  const viewSelect = document.getElementById("view-select");
  const layerSelect = document.getElementById("layer-select");
  const countySelect = document.getElementById("county-select");
  const countyContainer = document.getElementById("county-container");
  const subdistSelect = document.getElementById("subdist-select");
  const subdistContainer = document.getElementById("subdist-container");

  // --- INITIAL DEFAULTS ---
  appState.selectedView = "us-states";
  appState.selectedLayer = "minnesota";
  appState.selectedFeature = null;
  console.log("[app.js] Initialized with States / Minnesota.");

  // --- RENDER INITIAL DROPDOWNS ---
  render();
  requestAnimationFrame(() => {
    loadSelectedLayer();
  });

  // --- MAP VIEWER ELEMENT ---
  const mapViewer = document.querySelector("map-viewer");
  if (!mapViewer) {
    console.error("[app.js] ERROR: <map-viewer> element not found in DOM!");
    return;
  }
  console.log("[app.js] <map-viewer> found.");

  // --- HELPER FUNCTIONS FOR MN PRECINCTS ---

  // Populate county dropdown ONLY for MN Precincts view
  function populateMNPrecinctCounties() {
    // Clear existing options first
    countySelect.innerHTML =
      "<option disabled selected>[ Select a County ]</option>";
  }

  // Update county options from loaded features (if available)
  function updateCountyOptions(rawFeatures) {
    // Pull counties from raw features using the actual property name "county"
    const counties = Array.from(
      new Set(
        (rawFeatures || [])
          .map((f) => f?.properties?.county) // LOWERCASE 'county'
          .filter(Boolean)
          .map((s) => String(s).trim())
      )
    ).sort();

    countySelect.innerHTML =
      "<option disabled selected>[ Select a County ]</option>" +
      counties.map((c) => `<option value="${c}">${c}</option>`).join("");
  }

  function maybeShowMNPrecinctControls() {
    const isMN = appState.selectedView === "mn-precincts";
    countyContainer.style.display = isMN ? "block" : "none";
    subdistContainer.style.display = isMN ? "block" : "none";
  }

  // Show/hide MN Precinct controls based on current view
  function updatePrecinctControlsVisibility() {
    const isMNPrecinctView = appState.selectedView === "mn-precincts";
    countyContainer.style.display = isMNPrecinctView ? "block" : "none";
    subdistContainer.style.display = isMNPrecinctView ? "block" : "none";

    // Only populate county dropdown when entering MN Precincts view
    if (isMNPrecinctView && countySelect.options.length <= 1) {
      populateMNPrecinctCounties();
    }
  }

  // --- VIEW SELECT CHANGE HANDLER ---
  viewSelect.addEventListener("change", () => {
    const selectedView = viewSelect.value;

    // Control dropdown visibility
    if (selectedView === "mn-precincts") {
      // SHOW for MN Precincts only
      countyContainer.style.display = "block";
      subdistContainer.style.display = "block";
      populateMNPrecinctCounties(); 
    } else {
      // HIDE for all other views
      countyContainer.style.display = "none";
      subdistContainer.style.display = "none";
    }

    render();
  });

  // --- COUNTY SELECT CHANGE HANDLER (for MN Precincts only) ---
  countySelect.addEventListener("change", async () => {
    // Only process if we're in MN Precincts view
    if (appState.selectedView !== "mn-precincts") return;

    const county = countySelect.value;
    console.log("[app] Loading precincts for county:", county);

    const countyUrl = `https://raw.githubusercontent.com/civic-interconnect/civic-data-boundaries-us-mn-precincts/main/data-out/counties/${county}/precincts.geojson`;
    const fallbackUrl =
      "https://raw.githubusercontent.com/civic-interconnect/civic-data-boundaries-us-mn-precincts/main/data-out/states/minnesota/precincts/2025-04/mn-precincts-web.geojson";

    let url = countyUrl;

    try {
      const resp = await fetch(countyUrl, { method: "HEAD" });
      if (!resp.ok) {
        console.warn(
          `[app] County file not found (${county}), falling back to statewide precincts.`
        );
        url = fallbackUrl;
      }
    } catch (err) {
      console.error("[app] Error checking county file:", err);
      url = fallbackUrl;
    }

    mapViewer.loadLayer({
      label: `${county} Precincts`,
      url,
      idProp: "PrecinctID",
      nameProp: "Precinct",
      style: { color: "#0b79d0" },
    });
  });

  // --- SUBDISTRICT SELECT CHANGE HANDLER ---
  subdistSelect.addEventListener("change", () => {
    // Only process if we're in MN Precincts view
    if (appState.selectedView !== "mn-precincts") return;

    const subdist = subdistSelect.value;
    console.log("[app] Filtering to subdistrict:", subdist);

    mapViewer.dispatchEvent(
      new CustomEvent("apply-precinct-filter", {
        detail: {
          county: countySelect.value || null,
          subdist: subdist,
        },
        bubbles: true,
        composed: true,
      })
    );
  });

  // --- WHEN FEATURES LOAD ---
  mapViewer.addEventListener("features-loaded", (e) => {
    console.log("[app.js] features-loaded event fired:", e.detail);

    const features = e.detail.features || [];
    const raw = e.detail.rawFeatures || [];
    const layerKey = appState.selectedLayer || "";

    if (features.length > 1 && layerKey) {
      featureData[layerKey] = features;
    } else if (layerKey) {
      featureData[layerKey] = [];
    }

    // If MN precincts view, build county list from RAW features and default to St. Louis once
    if (appState.selectedView === "mn-precincts") {
      updateCountyOptions(raw);

      // Default to St. Louis if nothing chosen yet
      if (!countySelect.value) {
        countySelect.value = "St. Louis";
        // Apply county filter immediately
        const mapViewer = document.querySelector("map-viewer");
        mapViewer.dispatchEvent(
          new CustomEvent("apply-precinct-filter", {
            detail: { county: "St. Louis" },
            bubbles: true,
            composed: true,
          })
        );
      }
    }

    // Re-render the normal dropdowns
    render();
  });

  // --- INITIALIZE FOOTER ---
  patchFooterStatus("./VERSION");
  console.log("[app.js] Footer status patch requested.");

  // --- INITIAL VISIBILITY CHECK ---
  updatePrecinctControlsVisibility();
});
