import "https://civic-interconnect.github.io/app-core/components/ci-header/ci-header.js";
import "https://civic-interconnect.github.io/app-core/components/ci-footer/ci-footer.js";

import { config } from "./config.js";
import { generateStateLayers } from "./layer-states.js";
import { generateCountyLayers } from "./layer-counties.js";
import { populateViews, createSlotSpan } from "./ui-utils.js";
import "./map-viewer.js";

const viewSelect = document.getElementById("view-select");
const layerSelect = document.getElementById("layer-select");
const featureSelect = document.getElementById("feature-select");
const featureContainer = document.getElementById("feature-container");
const mapViewer = document.querySelector("map-viewer");

config.groups["us-states"].layers = generateStateLayers();
config.groups["us-counties"].layers = generateCountyLayers();

let selectedState = null;

viewSelect.addEventListener("change", (e) => {
  const selectedKey = e.target.value;
  const groupConfig = config.groups[selectedKey];

  if (!groupConfig) return;

  layerSelect.innerHTML = "";
  featureSelect.innerHTML = "";
  featureContainer.style.display = "none";

  if (groupConfig.layers && Object.keys(groupConfig.layers).length > 0) {
    for (const [layerKey, layer] of Object.entries(groupConfig.layers)) {
      const opt = document.createElement("option");
      opt.value = layerKey;
      opt.textContent = layer.label;
      layerSelect.appendChild(opt);
    }

    let layerToLoad = null;

    if (selectedState && groupConfig.layers[selectedState]) {
      // Keep same state when switching views
      layerSelect.value = selectedState;
      layerToLoad = groupConfig.layers[selectedState];

      mapViewer.loadLayer(layerToLoad, {
        skipFitBounds: true,
      });
    } else {
      if (layerSelect.options.length > 0) {
        layerSelect.selectedIndex = 0;
        const firstLayerKey = layerSelect.value;
        selectedState = firstLayerKey;
        layerToLoad = groupConfig.layers[firstLayerKey];

        mapViewer.loadLayer(layerToLoad);
      }
    }
  } else if (groupConfig.file) {
    mapViewer.loadLayer(groupConfig);
  }
});

// Handle changes in the Layer dropdown
layerSelect.addEventListener("change", () => {
  const groupKey = viewSelect.value;
  const group = config.groups[groupKey];
  const layerKey = layerSelect.value;

  selectedState = layerKey;

  const layer = group?.layers?.[layerKey];
  if (!layer) return;

  // When switching states, we DO want to fit bounds
  mapViewer.loadLayer(layer);
  featureSelect.innerHTML = "";
});

// When features load, manage the 3rd dropdown
mapViewer.addEventListener("features-loaded", (e) => {
  const features = e.detail.features;
  featureSelect.innerHTML = "";

  if (features.length <= 1) {
    featureContainer.style.display = "none";
  } else {
    featureContainer.style.display = "flex";

    features.forEach((f) => {
      const opt = document.createElement("option");
      opt.value = f.id;
      opt.textContent = f.name;
      featureSelect.appendChild(opt);
    });

    // Auto-select the first feature
    featureSelect.selectedIndex = 0;
    featureSelect.dispatchEvent(new Event("change"));
  }
});

// Highlight a selected feature
featureSelect.addEventListener("change", () => {
  const id = featureSelect.value;
  mapViewer.highlightFeature(id, { skipZoom: true });
});

// Load status.json and patch footer
document.addEventListener("DOMContentLoaded", () => {
  fetch("status.json")
    .then((res) => res.json())
    .then((data) => {
      const footer = document.querySelector("ci-footer");
      if (footer) {
        footer
          .querySelector('[slot="version"]')
          ?.replaceWith(
            createSlotSpan(
              "version",
              `Version: ${data.dashboard_version || "—"}`
            )
          );
        footer
          .querySelector('[slot="updated"]')
          ?.replaceWith(
            createSlotSpan("updated", `Updated: ${data.generated || "—"}`)
          );
      }
    })
    .catch((error) => console.error("Failed to load status.json:", error));
});

// Initial boot
function init() {
  populateViews(config, viewSelect);

  const defaultKey = "us-states";
  viewSelect.value = defaultKey;

  // Trigger change event so dropdowns populate
  viewSelect.dispatchEvent(new Event("change"));
}

init();
