// app/utils/label-layer.js
// Utility for adding zoom-controlled name labels to Leaflet maps.

export class LabelLayerController {
  constructor(map, config = {}) {
    this.map = map;
    this.nameProp = config.nameProp || "name";
    this.minZoom = config.minZoom || 11;
    this._labelLayer = L.layerGroup();
    this._labelsEnabled = false;
    this._zoomHandlerBound = this._updateVisibility.bind(this);
  }

  /** Build or rebuild labels for a given GeoJSON or feature layer. */
  buildLabels(geoJsonLayer) {
    this._labelLayer.clearLayers();

    geoJsonLayer.eachLayer((layer) => {
      const feature = layer.feature;
      const name = feature?.properties?.[this.nameProp];
      if (!name) return;

      const latlng = this._getLabelPoint(layer);
      if (!latlng) return;

      const marker = L.marker(latlng, {
        interactive: false,
        icon: L.divIcon({
          className: "feature-label",
          html: `<span>${this._escapeHtml(name)}</span>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        }),
        pane: "markerPane",
      });

      this._labelLayer.addLayer(marker);
    });

    this._updateVisibility(); // obey current zoom
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

  // ---- internal helpers ----

  _updateVisibility() {
    if (!this.map) return;
    const show = this.map.getZoom() >= this.minZoom;

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
}
