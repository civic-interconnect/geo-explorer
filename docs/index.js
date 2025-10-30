// index.js
// Main entry point for GeoExplorer app

// --- COMPONENTS / FOOTER PATCH ---
import "./components/ci-header/ci-header.js";
import "./components/ci-footer/ci-footer.js";
import "./components/ci-theme-toggle/ci-theme-toggle.js";
import { patchFooterStatus } from "https://civic-interconnect.github.io/app-core/index-init.js";

// --- APP STATE / CONFIG / LAYERS ---
import { appState } from "./app-state.js";
import { config } from "./config.js";
import { generateStateLayers } from "./app/layer-states.js";
import { generateCountyLayers } from "./app/layer-counties.js";
import { generateCD118Layers } from "./app/layer-cd118.js";
import { generateMNPrecinctLayers } from "./app/layer-mn-precincts.js";

// --- DROPDOWN RENDERERS ---
import { renderSubdistrictDropdown } from "./app/dropdown-05-subdist.js";
import { renderCountyDropdown } from "./app/dropdown-04-county.js";
import { renderFeatureDropdown } from "./app/dropdown-03-feature.js";
import { renderLayerDropdown } from "./app/dropdown-02-layer.js";
import { renderViewDropdown } from "./app/dropdown-01-view.js";

// --- STORES ---
import { featureData } from "./app/store-feature.js";

// --- DEFINE CUSTOM ELEMENT AFTER OTHER IMPORTS ---
import "./app/map-viewer.js";

console.log("GeoExplorer app initialized");

// Keep the same module-scoped raw-cache your original code relied on.
let currentRawFeatures = [];

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

  console.log("[DEBUG] loadSelectedLayer: view=%s layerKey=%s layer? %s",
    appState.selectedView, layerKey, Boolean(layer));

  if (layer) {
    const mapViewer = document.querySelector("map-viewer");
    mapViewer.loadLayer(layer, { skipFitBounds: false });
    console.log("[DEBUG] loadSelectedLayer: invoked mapViewer.loadLayer()");
  } else {
    console.warn("[app.js] No layer to load for current app state.");
  }
}

export function render() {
  console.log("[DEBUG] RENDER START. appState:", JSON.parse(JSON.stringify(appState)));
  renderViewDropdown();
  renderLayerDropdown();
  renderFeatureDropdown();
  renderCountyDropdown();
  renderSubdistrictDropdown();
  console.log("[DEBUG] RENDER COMPLETE. appState:", JSON.parse(JSON.stringify(appState)));
}

// ---------- EVENTS ----------
document.addEventListener("DOMContentLoaded", () => {
  console.log("[DEBUG] DOMContentLoaded fired");

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
  console.log("[DEBUG] INIT: defaults set {view:%s, layer:%s, feature:%s}",
    appState.selectedView, appState.selectedLayer, String(appState.selectedFeature));

  // --- RENDER INITIAL DROPDOWNS ---
  console.log("[DEBUG] INIT: first render()");
  render();

  console.log("[DEBUG] INIT: schedule first loadSelectedLayer on rAF");
  requestAnimationFrame(() => {
    loadSelectedLayer();
  });

  // --- MAP VIEWER ELEMENT ---
  const mapViewer = document.querySelector("map-viewer");
  if (!mapViewer) {
    console.error("[app.js] ERROR: <map-viewer> element not found in DOM!");
    return;
  }
  console.log("[DEBUG] <map-viewer> found and ready");

  // --- HELPER FUNCTIONS FOR MN PRECINCTS ---

  // Populate county dropdown ONLY for MN Precincts view
  function populateMNPrecinctCounties() {
    console.log("[DEBUG] populateMNPrecinctCounties(): set placeholder");
    countySelect.innerHTML = "<option disabled selected>[ Select a County ]</option>";
  }

  // Update county options from loaded features (if available)
  function updateCountyOptions(rawFeatures) {
    console.log("[DEBUG] updateCountyOptions(): raw count=%d",
      Array.isArray(rawFeatures) ? rawFeatures.length : -1);

    const counties = Array.from(
      new Set(
        (rawFeatures || [])
          .map((f) => f?.properties?.county) // LOWERCASE 'county'
          .filter(Boolean)
          .map((s) => String(s).trim())
      )
    ).sort();

    countySelect.innerHTML =
      '<option disabled selected>[ Select a County ]</option>' +
      counties.map((c) => `<option value="${c}">${c}</option>`).join("");

    console.log("[DEBUG] updateCountyOptions(): populated %d counties", counties.length);
  }

  // Show/hide MN Precinct controls based on current view
  function updatePrecinctControlsVisibility() {
    const isMNPrecinctView = appState.selectedView === "mn-precincts";
    countyContainer.style.display = isMNPrecinctView ? "flex" : "none";
    subdistContainer.style.display = isMNPrecinctView ? "flex" : "none";

    console.log("[DEBUG] updatePrecinctControlsVisibility(): isMN=%s, county=%s, subdist=%s",
      isMNPrecinctView,
      countyContainer.style.display,
      subdistContainer.style.display
    );

    // Only populate county dropdown when entering MN Precincts view
    if (isMNPrecinctView && countySelect.options.length <= 1) {
      populateMNPrecinctCounties();
    }
  }

  // --- VIEW SELECT CHANGE HANDLER ---
  viewSelect.addEventListener("change", () => {
    const selectedView = viewSelect.value;
    appState.selectedView = selectedView;

    console.log("[DEBUG] VIEW CHANGE: selectedView=%s", selectedView);

    // Control dropdown visibility
    if (selectedView === "mn-precincts") {
      // SHOW for MN Precincts only
      countyContainer.style.display = "flex";
      subdistContainer.style.display = "flex";
      populateMNPrecinctCounties();
      console.log("[DEBUG] VIEW CHANGE: MN view -> show boxes 4/5, placeholder set");
    } else {
      // HIDE for all other views
      countyContainer.style.display = "none";
      subdistContainer.style.display = "none";
      console.log("[DEBUG] VIEW CHANGE: non-MN view -> hide boxes 4/5");
    }

    console.log("[DEBUG] VIEW CHANGE: render()");
    render();

    if (selectedView === "mn-precincts") {
      console.log("[DEBUG] VIEW CHANGE: MN -> schedule loadSelectedLayer() to populate counties");
      requestAnimationFrame(() => loadSelectedLayer());
    }
  });

  // --- COUNTY SELECT CHANGE HANDLER (for MN Precincts only) ---
  countySelect.addEventListener("change", () => {
    if (appState.selectedView !== "mn-precincts") return;

    const county = countySelect.value;
    appState.selectedCounty = county; // store selected county
    appState.selectedSubdist = null; // reset subdist when county changes

    console.log("[DEBUG] COUNTY CHANGE: selectedCounty=%s, reset selectedSubdist", county);

    // Re-render to update subdist dropdown from the latest raw
    console.log("[DEBUG] COUNTY CHANGE: renderSubdistrictDropdown(currentRawFeatures) with raw=%d",
      currentRawFeatures.length);
    renderSubdistrictDropdown(currentRawFeatures);

    // Apply county filter to map
    console.log("[DEBUG] COUNTY CHANGE: dispatch apply-precinct-filter {county:%s, subdist:null}", county);
    mapViewer.dispatchEvent(
      new CustomEvent("apply-precinct-filter", {
        detail: { county: county, subdist: null },
        bubbles: true,
        composed: true,
      })
    );
  });

  // --- SUBDISTRICT SELECT CHANGE HANDLER ---
  subdistSelect.addEventListener("change", () => {
    if (appState.selectedView !== "mn-precincts") return;

    const subdist = subdistSelect.value;
    console.log("[DEBUG] SUBDIST CHANGE: subdist=%s", subdist);

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
    console.log("[DEBUG] SUBDIST CHANGE: dispatched apply-precinct-filter");
  });

  // --- WHEN FEATURES LOAD ---
  mapViewer.addEventListener("features-loaded", (e) => {
    console.log("[DEBUG] FEATURES-LOADED: event detail present=%s", Boolean(e?.detail));

    const features = e.detail?.features || [];
    const raw = e.detail?.rawFeatures || [];
    const layerKey = appState.selectedLayer || "";

    console.log("[DEBUG] FEATURES-LOADED: features=%d raw=%d layerKey=%s",
      features.length, raw.length, layerKey);

    currentRawFeatures = raw;

    if (features.length > 1 && layerKey) {
      featureData[layerKey] = features;
      console.log("[DEBUG] FEATURES-LOADED: featureData[%s]=%d", layerKey, features.length);
    } else if (layerKey) {
      featureData[layerKey] = [];
      console.log("[DEBUG] FEATURES-LOADED: featureData[%s]=[]", layerKey);
    }

    // If MN precincts view, update dropdowns (counties) from raw
    if (appState.selectedView === "mn-precincts") {
      console.log("[DEBUG] FEATURES-LOADED: MN view -> updateCountyOptions(raw)");
      updateCountyOptions(raw);
    }

    console.log("[DEBUG] FEATURES-LOADED: renderers start");
    renderViewDropdown();
    renderLayerDropdown();
    renderFeatureDropdown();      // Box 3 (Features)
    renderCountyDropdown();       // Box 4 (Counties)
    renderSubdistrictDropdown(raw);
    console.log("[DEBUG] FEATURES-LOADED: renderers complete");
  });

  // --- INITIALIZE FOOTER ---
  patchFooterStatus("./VERSION");
  console.log("[DEBUG] FOOTER: patch requested from ./VERSION");

  // --- INITIAL VISIBILITY CHECK ---
  console.log("[DEBUG] INIT: updatePrecinctControlsVisibility()");
  updatePrecinctControlsVisibility();
});
