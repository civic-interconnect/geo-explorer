// app/dropdown-04-county.js
import { DropdownControlGroup } from "../components/DropdownControlGroup.js";
import { appState } from "../app-state.js";
import { countyData } from "./store-county.js";
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

  // Only show for the MN Precincts view
  console.log("[dropdown-county] Current view:", appState.selectedView);
  if (appState.selectedView !== "mn-precincts") {
    container.style.display = "none"; // Hide instead of clearing
    return;
  }
  container.style.display = "block";

  const layerKey = appState.selectedLayer;
  const feats = (layerKey && featureData[layerKey]) || [];
  console.log("[dropdown-04-county] Features for layer", layerKey, feats);

    // Build unique county list
  const counties = Array.from(
    new Set(
      feats
        .map(f => f?.properties?.County)
        .filter(v => typeof v === "string" && v.length > 0)
    )
  ).sort();
  console.log("[dropdown-county] Available counties:", counties);

  // Don't hide if no counties yet - they'll load after the layer loads
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
