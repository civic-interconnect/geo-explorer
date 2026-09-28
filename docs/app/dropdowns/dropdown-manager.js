// dropdown-manager.js
// Coordinates between existing dropdown files and manages their interactions

import { filterState } from "../filters/filter-state.js";
//import { refs } from "../../ui/dom-refs.js"; //TODO

export class DropdownManager {
  constructor(mapViewer) {
    this.mapViewer = mapViewer;
    this.cachedRawFeatures = [];
    this.isUpdating = false; // Flag to prevent recursive updates

    // Import the render functions from existing dropdown files
    this.dropdownRenderers = null;
    this.loadDropdownRenderers();
    this.attachEventListeners();
  }

  async loadDropdownRenderers() {
    // Dynamically import the existing dropdown modules
    const modules = await Promise.all([
      import("./dropdown-01-view.js"),
      import("./dropdown-02-layer.js"),
      import("./dropdown-03-feature.js"),
      import("./dropdown-04-county.js"),
      import("./dropdown-05-subdist.js"),
      import("./dropdown-06-precinct.js"),
    ]);

    this.dropdownRenderers = {
      view: modules[0].renderViewDropdown,
      layer: modules[1].renderLayerDropdown,
      feature: modules[2].renderFeatureDropdown,
      county: modules[3].renderCountyDropdown,
      subdist: modules[4].renderSubdistrictDropdown,
      precinct: modules[5].renderPrecinctDropdown,
    };
  }

  attachEventListeners() {
    // Listen for features loaded from map
    this.mapViewer.addEventListener("features-loaded", (e) => {
      console.log("[DropdownManager] Features loaded:", e.detail);
      this.cachedRawFeatures = e.detail.rawFeatures || [];
      this.updateDropdownsForLayer();
    });

    // Listen for filter state changes
    filterState.subscribe((state) => {
      console.log("[DropdownManager] Filter state changed:", state);
      this.handleFilterChange(state);
    });

    // Listen for layer type changes
    this.mapViewer.addEventListener("layer-changed", (e) => {
      console.log("[DropdownManager] Layer changed to:", e.detail);
      this.resetDropdownsForLayer(e.detail.type);
    });
  }

  updateDropdownsForLayer() {
    const layerType = this.mapViewer.config?.type;

    // For MN Precincts, update county and subdist dropdowns
    if (layerType === "precincts") {
      // Re-render county dropdown with available counties
      if (this.dropdownRenderers?.county) {
        this.dropdownRenderers.county(this.cachedRawFeatures);
      }

      // Re-render subdist dropdown (filtered by selected county if any)
      if (this.dropdownRenderers?.subdist) {
        this.dropdownRenderers.subdist(this.cachedRawFeatures);
      }

      // Re-render precinct dropdown
      if (this.dropdownRenderers?.precinct) {
        this.dropdownRenderers.precinct(this.cachedRawFeatures);
      }
    }

    // For other layer types, update feature dropdown
    else if (this.dropdownRenderers?.feature) {
      this.dropdownRenderers.feature();
    }
  }

  handleFilterChange(state) {
    // Prevent recursive updates
    if (this.isUpdating) return;

    // When county changes, update subdist and precinct dropdowns
    if (state.filters.county !== undefined) {
      console.log("[DropdownManager] County changed to:", state.filters.county);

      this.isUpdating = true; // Set flag before making changes

      // Only clear subdist if it's not already null (prevents infinite loop)
      if (state.filters.subdist !== null) {
        filterState.setFilter("subdist", null);
      }

      this.isUpdating = false; // Clear flag after changes

      // Re-render subdist dropdown with filtered options
      if (this.dropdownRenderers?.subdist) {
        this.dropdownRenderers.subdist(this.cachedRawFeatures);
      }

      // Re-render precinct dropdown
      if (this.dropdownRenderers?.precinct) {
        this.dropdownRenderers.precinct(this.cachedRawFeatures);
      }
    }

    // When subdist changes, update precinct dropdown
    if (state.filters.subdist !== undefined && !this.isUpdating) {
      console.log(
        "[DropdownManager] Subdist changed to:",
        state.filters.subdist
      );

      // Re-render precinct dropdown with filtered options
      if (this.dropdownRenderers?.precinct) {
        this.dropdownRenderers.precinct(this.cachedRawFeatures);
      }
    }
  }

  resetDropdownsForLayer(layerType) {
    // Clear all filters when layer changes
    filterState.clearAll();

    // Hide/show appropriate dropdowns based on layer type
    const countyContainer = document.getElementById("county-container");
    const subdistContainer = document.getElementById("subdist-container");
    const precinctContainer = document.getElementById("precinct-container");
    const featureContainer = document.getElementById("feature-container");

    if (layerType === "precincts") {
      console.log(
        "[DropdownManager] Resetting dropdowns for MN Precincts layer"
      );
      // Show county, subdist, precinct dropdowns
      if (countyContainer) countyContainer.style.display = "flex";
      if (subdistContainer) subdistContainer.style.display = "flex";
      if (precinctContainer) precinctContainer.style.display = "flex";
      // Hide feature dropdown
      if (featureContainer) featureContainer.style.display = "none";
    } else {
      // Hide county, subdist, precinct dropdowns
      if (countyContainer) countyContainer.style.display = "none";
      if (subdistContainer) subdistContainer.style.display = "none";
      if (precinctContainer) precinctContainer.style.display = "none";
      // Show feature dropdown (if applicable)
      if (featureContainer) featureContainer.style.display = "flex";
    }
  }

  // Public methods for external control

  refreshAll() {
    this.updateDropdownsForLayer();
  }

  getSelectedFilters() {
    return filterState.getFilters();
  }

  clearFilters() {
    filterState.clearAll();
  }
}

export default DropdownManager;
