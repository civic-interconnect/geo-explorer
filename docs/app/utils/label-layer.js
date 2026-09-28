// app/utils/label-layer.js
// Utility for adding zoom-controlled name labels to Leaflet maps.

import { shouldShowLabels } from "./label-density-config.js";

export class LabelLayerController {
  constructor(map, config = {}) {
    this.map = map;
    this.nameProp = config.nameProp || "name";
    this.minZoom = config.minZoom || 8; // LOWERED: was 11, now 8
    this.alwaysShow = config.alwaysShow || false;
    this.useColorCoding = config.useColorCoding || true; // NEW: enable A/B/C/D color coding
    this.filterCallback = config.filterCallback || null; // NEW: filter function
    this.maxLabels = config.maxLabels || 100; // NEW: limit visible labels

    this._labelLayer = L.layerGroup();
    this._labelsEnabled = false;
    this._zoomHandlerBound = this._updateVisibility.bind(this);
    this._featureCount = 0; // NEW: track feature count
    this._isFiltered = false; // NEW: track filter state

    // Color palette for letter suffixes
    this._letterColors = {
      A: "#dc2626", // red
      B: "#2563eb", // blue
      C: "#16a34a", // green
      D: "#9333ea", // purple
      E: "#ea580c", // orange
      F: "#0891b2", // cyan
    };
  }

  setHighlighted(isHighlighted) {
    this._isHighlighted = isHighlighted;
    this._updateVisibility();
  }

  /** Build or rebuild labels for a given GeoJSON or feature layer. */
  buildLabels(geoJsonLayer) {
    this._labelLayer.clearLayers();
    let labelCount = 0;

    geoJsonLayer.eachLayer((layer) => {
      const feature = layer.feature;
      const name = feature?.properties?.[this.nameProp];
      if (!name) return;

      // Apply filter if provided
      if (this.filterCallback && !this.filterCallback(layer)) {
        return; // Skip this label
      }

      // Stop if we've hit max labels (unless alwaysShow)
      if (!this.alwaysShow && labelCount >= this.maxLabels) {
        return;
      }

      const latlng = this._getLabelPoint(layer);
      if (!latlng) return;

      // Get color based on suffix
      const color = this.useColorCoding
        ? this._getColorForLabel(name)
        : "#000000";

      const marker = L.marker(latlng, {
        interactive: false,
        icon: L.divIcon({
          className: "feature-label precinct-label",
          html: `<div style="
          transform: translate(-50%, -50%);
          display: inline-block;
        ">
          <span style="color: ${color};">${this._escapeHtml(name)}</span>
        </div>`,
          iconSize: [0, 0], // Keep at [0, 0]
          iconAnchor: [0, 0], // Keep at [0, 0]
        }),
        pane: "markerPane",
      });

      this._labelLayer.addLayer(marker);
      labelCount++;
    });

    this._featureCount = labelCount;
    this._updateVisibility(); // obey current zoom
  }

  setFilter(filterCallback) {
    this.filterCallback = filterCallback;
    this._isFiltered = !!filterCallback;
  }

  /** Enable automatic show/hide on zoom. */
  enable() {
    if (!this.map) return;
    this.map.on("zoomend", this._zoomHandlerBound);
    this._updateVisibility();
  }

  /** Disable automatic updates and remove labels. */
  disable() {
    if (!this.map) return;
    this.map.off("zoomend", this._zoomHandlerBound);
    if (this._labelsEnabled) {
      this.map.removeLayer(this._labelLayer);
      this._labelsEnabled = false;
    }
  }

  /** Set whether labels should always show regardless of zoom */
  setAlwaysShow(value) {
    this.alwaysShow = value;
    this._updateVisibility();
  }

  // Method to force rebuild (useful after filtering)
  rebuild(geoJsonLayer) {
    if (geoJsonLayer) {
      this.buildLabels(geoJsonLayer);
    }
  }

  // ---- internal helpers ----

  _updateVisibility() {
    if (!this.map) return;

    const currentZoom = this.map.getZoom();

    // Hide labels when something is highlighted
    if (this._isHighlighted) {
      if (this._labelsEnabled) {
        this.map.removeLayer(this._labelLayer);
        this._labelsEnabled = false;
      }
      return;
    }

    console.log(
      "[LabelLayerController] Zoom:",
      currentZoom,
      "Feature count:",
      this._featureCount
    );
    const show = shouldShowLabels(
      this._featureCount,
      currentZoom,
      this.minZoom,
      this._isFiltered || this.alwaysShow
    );

    if (show && !this._labelsEnabled) {
      this._labelLayer.addTo(this.map);
      this._labelsEnabled = true;
    } else if (!show && this._labelsEnabled) {
      this.map.removeLayer(this._labelLayer);
      this._labelsEnabled = false;
    }
  }

  _getLabelPoint(layer) {
    try {
      if (layer.getCenter) return layer.getCenter();
      if (layer.getBounds) return layer.getBounds().getCenter();
    } catch {
      return null;
    }
    return null;
  }

  _escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // NEW: Get color based on letter suffix
  _getColorForLabel(name) {
    if (!name) return "#000000";

    const str = String(name).trim();
    // Extract last character if it's a letter
    const lastChar = str.slice(-1).toUpperCase();

    if (/[A-Z]/.test(lastChar)) {
      return this._letterColors[lastChar] || "#000000";
    }

    return "#000000"; // default black for numbers without letters
  }
}
