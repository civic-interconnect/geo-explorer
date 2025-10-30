// app/dropdown-04-county.js
import { DropdownControlGroup } from "../components/DropdownControlGroup.js";
import { appState } from "../app-state.js";
import { featureData } from "./store-feature.js";

import { sortByKey } from "https://civic-interconnect.github.io/app-core/utils/ui-utils.js";
import { render } from "../index.js";

function ensureContainer() {
  let el = document.getElementById("county-dropdown");
  if (!el) {
    el = document.createElement("div");
    el.id = "county-dropdown";
    document.querySelector("#controls")?.appendChild(el);
  }
  return el;
}


export function renderCountyDropdown() {
  const container = ensureContainer();
  if (!container) {
    console.error("[dropdown-county] County container not found!");
    return;
  }

  if (appState.selectedView === "mn-precincts") {
    console.log("[dropdown-county] MN view detected; preserving counties populated from raw. Skipping rebuild.");
    container.style.display = "flex";
    return; 
  }

  // Non-MN path (safe to build from featureData)
  console.log("[dropdown-county] Current view:", appState.selectedView);
  container.style.display = "flex";

  const layerKey = appState.selectedLayer;
  const feats = (layerKey && featureData[layerKey]) || [];
  console.log("[dropdown-04-county] Features for layer", layerKey, feats);

  const counties = Array.from(
    new Set(
      feats
        .map(f => f?.properties?.county)
        .filter(v => typeof v === "string" && v.length > 0)
    )
  ).sort();
  console.log("[dropdown-county] Available counties:", counties);

  const countiesMap = counties.map(c => ({
    value: c.id,
    label: c.name
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
