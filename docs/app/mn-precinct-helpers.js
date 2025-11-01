// app/mn-precinct-helpers.js

/**
 * Populate county dropdown with placeholder
 * @param {HTMLSelectElement} countySelect - The county select element
 */
export function populateMNPrecinctCounties(countySelect) {
  if (!countySelect) return false;

  console.log("[DEBUG] populateMNPrecinctCounties(): set placeholder");
  countySelect.innerHTML =
    "<option disabled selected>[ Select a County ]</option>";
  return true;
}

/**
 * Update visibility of control containers
 * @param {Object} containers - Object with DOM elements
 * @param {string} selectedView - Current selected view
 */
export function updateControlsVisibility(containers, selectedView) {
  const { featureContainer, countyContainer, subdistContainer, countySelect } =
    containers;

  // Feature container (Box 3) - show for Congressional Districts
  if (featureContainer) {
    featureContainer.style.display =
      selectedView === "us-congress" ? "flex" : "none";
  }

  // County & Subdist containers (Boxes 4 & 5) - show for MN Precincts
  const isMNPrecinctView = selectedView === "mn-precincts";

  if (countyContainer) {
    countyContainer.style.display = isMNPrecinctView ? "flex" : "none";
  }

  if (subdistContainer) {
    subdistContainer.style.display = isMNPrecinctView ? "flex" : "none";
  }

  console.log(
    "[DEBUG] updateControlsVisibility(): view=%s, feature=%s, county=%s, subdist=%s",
    selectedView,
    featureContainer?.style.display,
    countyContainer?.style.display,
    subdistContainer?.style.display
  );

  // Populate county dropdown when entering MN Precincts view
  if (isMNPrecinctView && countySelect && countySelect.options.length <= 1) {
    populateMNPrecinctCounties(countySelect);
  }

  return true;
}

/**
 * Handle view change event
 * @param {string} newView - The newly selected view
 * @param {Object} deps - Dependencies object
 */
export function handleViewChange(newView, deps) {
  const { appState, containers, render, loadSelectedLayer } = deps;

  appState.selectedView = newView;
  console.log("[DEBUG] VIEW CHANGE: selectedView=%s", newView);

  // Update visibility
  updateControlsVisibility(containers, newView);

  // Re-render
  render();

  // Load layer for MN precincts
  if (newView === "mn-precincts") {
    console.log("[DEBUG] VIEW CHANGE: MN -> schedule loadSelectedLayer()");
    requestAnimationFrame(() => loadSelectedLayer());
  }
}

/**
 * Handle county change event
 * @param {string} selectedCounty - The selected county
 * @param {Object} deps - Dependencies object
 */
export function handleCountyChange(selectedCounty, deps) {
  const { appState, mapViewer, currentRawFeatures, renderSubdistrictDropdown } =
    deps;

  if (appState.selectedView !== "mn-precincts") return;

  appState.selectedCounty = selectedCounty;
  appState.selectedSubdist = null;

  console.log(
    "[DEBUG] COUNTY CHANGE: selectedCounty=%s, reset selectedSubdist",
    selectedCounty
  );

  // Re-render subdist dropdown
  renderSubdistrictDropdown(currentRawFeatures);

  // Apply filter to map
  if (mapViewer) {
    dispatchPrecinctFilter(mapViewer, {
      county: selectedCounty,
      subdist: null,
    });
  }
}

/**
 * Handle subdistrict change event
 * @param {string} selectedSubdist - The selected subdistrict
 * @param {Object} deps - Dependencies object
 */
export function handleSubdistChange(selectedSubdist, deps) {
  const { appState, mapViewer, countySelect } = deps;

  if (appState.selectedView !== "mn-precincts") return;

  console.log("[DEBUG] SUBDIST CHANGE: subdist=%s", selectedSubdist);

  if (mapViewer && countySelect) {
    dispatchPrecinctFilter(mapViewer, {
      county: countySelect.value || null,
      subdist: selectedSubdist,
    });
  }
}

/**
 * Dispatch precinct filter event
 * @param {HTMLElement} mapViewer - Map viewer element
 * @param {Object} filterData - Filter data {county, subdist}
 */
export function dispatchPrecinctFilter(mapViewer, filterData) {
  if (!mapViewer) return false;

  mapViewer.dispatchEvent(
    new CustomEvent("apply-precinct-filter", {
      detail: filterData,
      bubbles: true,
      composed: true,
    })
  );

  console.log("[DEBUG] Dispatched apply-precinct-filter:", filterData);
  return true;
}

/**
 * Handle features loaded event
 * @param {Object} eventDetail - Event detail from features-loaded
 * @param {Object} deps - Dependencies object
 */
export function handleFeaturesLoaded(eventDetail, deps) {
  const {
    appState,
    featureData,
    updateCountyOptionsFn,
    render,
    renderSubdistrictDropdown,
  } = deps;

  const features = eventDetail?.features || [];
  const raw = eventDetail?.rawFeatures || [];
  const layerKey = appState.selectedLayer || "";

  console.log(
    "[DEBUG] FEATURES-LOADED: features=%d raw=%d layerKey=%s",
    features.length,
    raw.length,
    layerKey
  );

  // Update feature data
  if (layerKey) {
    featureData[layerKey] = features.length > 1 ? features : [];
    console.log(
      "[DEBUG] FEATURES-LOADED: featureData[%s]=%d",
      layerKey,
      featureData[layerKey].length
    );
  }

  // Update counties for MN precincts
  if (appState.selectedView === "mn-precincts") {
    console.log("[DEBUG] FEATURES-LOADED: MN view -> updateCountyOptions");
    updateCountyOptionsFn(raw);
  }

  // Re-render
  console.log("[DEBUG] FEATURES-LOADED: renderers start");
  render();
  renderSubdistrictDropdown(raw);
  console.log("[DEBUG] FEATURES-LOADED: renderers complete");

  return raw; // Return for currentRawFeatures storage
}
