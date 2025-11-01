// app/dropdown-04-county.js
import { DropdownControlGroup } from "../components/DropdownControlGroup.js";
import { appState } from "../app-state.js";
import { featureData } from "./store-feature.js";
import { sortByKey } from "https://civic-interconnect.github.io/app-core/utils/ui-utils.js";
import { render } from "../index.js";


/**
 * Ensures the county dropdown container exists.
 * @returns {HTMLElement} The county dropdown container element.
 */
function ensureContainer() {
  if (typeof document === "undefined") {
    return null;
  }
  let el = document.getElementById("county-dropdown");
  if (!el) {
    el = document.createElement("div");
    el.id = "county-dropdown";
    const controlsElement = document.querySelector("#controls");
    if (controlsElement) {
      controlsElement.appendChild(el);
    }
  }
  return el;
}


/**
 * Renders the County selection dropdown.
 * When the county changes, it updates the app state,
 * applies the precinct filter on the map,
 * and triggers a re-render of the UI.
 * @returns {void}
 */
export function renderCountyDropdown() {
  const container = ensureContainer();
  if (!container) {
    console.error("[dropdown-county] County container not found!");
    return;
  }

  if (appState.selectedView === "mn-precincts") {
    console.log(
      "[dropdown-county] MN view detected; preserving counties populated from raw. Skipping rebuild."
    );
    container.style.display = "flex";
    return;
  }

  // Non-MN path (safe to build from featureData)
  console.log("[dropdown-county] Current view:", appState.selectedView);
  if (appState.selectedView !== "mn-precincts") {
    container.style.display = "none"; // Hide instead of clearing
    return;
  }
  container.style.display = "block";

  const layerKey = appState.selectedLayer;
  const feats = (layerKey && featureData[layerKey]) || [];
  console.log("[dropdown-04-county] Features for layer", layerKey, feats);

  const counties = Array.from(
    new Set(
      feats
        .map((f) => f?.properties?.county)
        .filter((v) => typeof v === "string" && v.length > 0)
    )
  ).sort();
  console.log("[dropdown-county] Available counties:", counties);

  const countiesMap = counties.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  DropdownControlGroup({
    selectId: "county-select",
    labelText: "Choose County",
    options: sortByKey(countiesMap, "label"),
    value: appState.selectedCounty,
    onChange: (newCounty) => {
      console.log("[dropdown-county.js] County changed:", newCounty);
      appState.selectedCounty = newCounty;

      // Get the map viewer and apply the precinct filter
      const mapViewer = document.querySelector("map-viewer");
      if (mapViewer) {
        // Find the county name from the ID
        const countyObj = counties.find((c) => c.id === newCounty);
        const countyName = countyObj ? countyObj.name : newCounty;

        // Dispatch event with county filter
        mapViewer.dispatchEvent(
          new CustomEvent("apply-precinct-filter", {
            detail: {
              county: countyName,
              subdist: appState.selectedSubdist,
            },
          })
        );
      }

      render();
    },
  });
}
