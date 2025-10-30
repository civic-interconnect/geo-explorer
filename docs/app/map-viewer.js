// app/map-viewer.js
// Custom Web Component for displaying GeoJSON on a Leaflet map

import { filterFeaturesByCountyAndSubdist } from "../utils/geo-utils.js";

export default class MapViewer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // Add Leaflet CSS to shadow DOM
    const leafletCSS = document.createElement("link");
    leafletCSS.rel = "stylesheet";
    leafletCSS.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    this.shadowRoot.appendChild(leafletCSS);

    // Create container for the map inside the Shadow DOM
    const container = document.createElement("div");
    container.id = "map-container";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.minHeight = "600px";
    this.shadowRoot.appendChild(container);

    // Store state-level view settings
    this._stateView = null; // { bounds, zoom, center }

    // New caches
    this._fullFeatureCollection = null; // the last loaded full GeoJSON
    this._lastFeaturesFlat = []; // convenience: flat array of raw features
  }

  applyMNPrecinctFilter({ county, subdist } = {}) {
    if (!this._fullFeatureCollection) return;
    console.log("[map-viewer] Filtering precincts:", { county, subdist });

    const countyProp = this.config?.filterCountyProp || "county";
    const subProp = this.config?.filterSubdistProp || "subdistrict";

    console.log("[map-viewer] Using property names:", { countyProp, subProp });
    console.log(
      "[map-viewer] Sample feature properties:",
      this._lastFeaturesFlat[0]?.properties
    );

    // Use shared utility (case-insensitive by default)
    const filtered = filterFeaturesByCountyAndSubdist(this._lastFeaturesFlat, {
      county,
      subdist,
      countyProp,
      subProp,
      caseInsensitive: true,
    });

    console.log(
      `[map-viewer] Filtered to ${filtered.length} features out of ${this._lastFeaturesFlat.length} total.`
    );

    this.layerGroup.clearLayers();

    // If filtering by county, style differently
    if (county && !subdist) {
      // Add all features but style them differently
      this._lastFeaturesFlat.forEach((feature) => {
        const featureCounty = feature.properties[countyProp];
        const isSelectedCounty =
          featureCounty && featureCounty.toLowerCase() === county.toLowerCase();

        const layer = L.geoJSON(feature, {
          style: isSelectedCounty
            ? this._getHighlightStyle()
            : this._getGhostedStyle(),
          onEachFeature: this._bindFeature.bind(this),
        });

        this.layerGroup.addLayer(layer);
      });
    } else {
      // Normal filtering - just show filtered features
      this.layerGroup.addData({
        type: "FeatureCollection",
        features: filtered,
      });
    }

    console.log(`[map-viewer] Filtered to ${filtered.length} features.`);

    // Fit bounds to filtered features only
    if (filtered.length > 0) {
      const filteredCollection = L.geoJSON({
        type: "FeatureCollection",
        features: filtered,
      });
      const bounds = filteredCollection.getBounds();

      if (bounds.isValid()) {
        this.map.fitBounds(bounds, {
          padding: [20, 20],
          maxZoom: 10,
        });
      }
    }
  }

  connectedCallback() {
    const container = this.shadowRoot.getElementById("map-container");

    // Initialize map with a reasonable default view (US center)
    this.map = L.map(container).setView([39, -98], 4);
    console.log(
      "Map initialized with view:",
      this.map.getCenter(),
      "zoom:",
      this.map.getZoom()
    );

    // Add OpenStreetMap tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 18,
    }).addTo(this.map);

    // Create GeoJSON layer with custom styles and tooltip
    this.layerGroup = L.geoJSON(null, {
      style: this._defaultStyle.bind(this),
      onEachFeature: this._bindFeature.bind(this),
    }).addTo(this.map);

    this.features = [];
    this.highlightedLayer = null;

    // Force tile layout recalculation
    setTimeout(() => {
      this.map.invalidateSize();
      console.log("Map size invalidated");
    }, 0);

    this.addEventListener("apply-precinct-filter", (e) => {
      // Accept optional detail { county, subdist }
      const detail = e?.detail || {};
      this.applyMNPrecinctFilter(detail);
    });
  }

  async loadLayer(config, options = {}) {
    console.log("Loading layer:", config);

    // Determine if this is a state-level view or a subdivision
    const isStateLevel =
      config.type === "state" || config.url.includes("/state.geojson");
    const isSubdivision =
      config.type === "counties" ||
      config.type === "cds" ||
      config.type === "precincts";

    // Clear existing data
    this.layerGroup.clearLayers();
    this.features = [];
    this.highlightedLayer = null;
    // Merge defaults so filters work even if layer config omits them
    this.config = {
      filterCountyProp: "county",
      filterSubdistProp: "subdistrict",
      ...config,
    };

    try {
      const url = config.url;
      if (!url) {
        throw new Error("Layer config missing 'url' property!");
      }

      console.log("Fetching GeoJSON from:", url);
      const response = await fetch(url);
      const geojson = await response.json();
      console.log("GeoJSON loaded, features count:", geojson.features.length);

      // Cache full FC and flat array of raw features
      this._fullFeatureCollection = geojson;
      this._lastFeaturesFlat = Array.isArray(geojson.features)
        ? geojson.features
        : [];

      // deduplicate features

      const uniqueFeatures = new Map();
      this._lastFeaturesFlat.forEach((f) => {
        const id = f.properties[this.config.idProp];
        const name = f.properties[this.config.nameProp];
        if (!uniqueFeatures.has(id)) {
          uniqueFeatures.set(id, { id, name });
        }
      });

      this.features = Array.from(uniqueFeatures.values());
      console.log("Unique features extracted:", this.features);

      // Add data to map
      this.layerGroup.addData(geojson);
      console.log("Data added to layer group");

      // Get bounds and log them
      const bounds = this.layerGroup.getBounds();
      console.log("Layer bounds:", bounds);
      console.log("Bounds valid?", bounds.isValid());
      console.log("Features length:", geojson.features.length);

      if (
        !options.skipFitBounds &&
        bounds.isValid() &&
        geojson.features.length > 0
      ) {
        if (isStateLevel) {
          // This is the main state view - save its bounds
          this.map.fitBounds(bounds, {
            padding: [20, 20],
            maxZoom: 7,
            minZoom: 4,
          });

          // Store the view for reuse
          this._stateView = {
            bounds: bounds,
            zoom: this.map.getZoom(),
            center: this.map.getCenter(),
          };

          console.log("Saved state view:", this._stateView);
        } else if (isSubdivision && this._stateView) {
          // This is a subdivision - reuse the state's view
          this.map.setView(this._stateView.center, this._stateView.zoom);
          console.log("Reusing state view for subdivision:", this._stateView);
        } else {
          // Fallback to normal fitBounds
          this.map.fitBounds(bounds, {
            padding: [20, 20],
            maxZoom: config.maxZoom || 8,
            minZoom: config.minZoom || 4,
          });
        }
      }

      // if (
      //   !options.skipFitBounds &&
      //   bounds.isValid() &&
      //   geojson.features.length > 0
      // ) {
      //   console.log("Fitting bounds with options...");

      //   const maxZoom =
      //     config.maxZoom || (geojson.features.length > 10 ? 5 : 10);
      //   const minZoom = config.minZoom || 4;

      //   this.map.fitBounds(bounds, {
      //     padding: [20, 20],
      //     maxZoom,
      //     minZoom,
      //   });

      //   console.log(
      //     "After fitBounds - center:",
      //     this.map.getCenter(),
      //     "zoom:",
      //     this.map.getZoom()
      //   );
      // } else {
      //   console.log("Skipping fitBounds because skipFitBounds = true");
      // }

      // Force map to recalculate size after loading
      setTimeout(() => {
        this.map.invalidateSize();
        console.log("Map size invalidated after loading");
        console.log(
          "Final - center:",
          this.map.getCenter(),
          "zoom:",
          this.map.getZoom()
        );
      }, 100);

      // Dispatch custom event for UI to populate feature dropdown
      this.dispatchEvent(
        new CustomEvent("features-loaded", {
          detail: {
            features: this.features, // id/name pairs
            rawFeatures: this._lastFeaturesFlat, // full raw features with properties
          },
          bubbles: true,
          composed: true,
        })
      );
    } catch (err) {
      const container = this.shadowRoot.getElementById("map-container");
      container.innerHTML = `<p style="color:red">Failed to load layer data.</p>`;
      console.error("Failed to load layer:", err);
    }
  }

  highlightFeature(id, { skipZoom = false } = {}) {
    console.log("Highlighting feature:", id, "skipZoom?", skipZoom);

    this.layerGroup.eachLayer((layer) => {
      const featureId = layer.feature.properties[this.config.idProp];
      if (featureId == id) {
        this._applyHighlightStyle(layer);

        if (!skipZoom) {
          this.map.fitBounds(layer.getBounds(), {
            maxZoom: this.config?.maxZoom ?? 8,
            padding: [10, 10],
          });
        }

        this.highlightedLayer = layer;
      } else {
        this._applySecondaryStyle(layer);
      }
    });
  }

  _bindFeature(feature, layer) {
    layer.bindTooltip(feature.properties[this.config.nameProp]);
    const name = feature.properties[this.config.nameProp];
    if (name) {
      layer.bindTooltip(name, { permanent: false, direction: "auto" });
    }
  }

  _getHighlightStyle() {
    return {
      color: "#e63946",
      weight: 2,
      opacity: 0.8,
      fillOpacity: 0.3,
    };
  }

  _getGhostedStyle() {
    return {
      color: "#999",
      weight: 0.5,
      opacity: 0.2,
      fillOpacity: 0.05,
      dashArray: "2,4",
    };
  }

  _defaultStyle() {
    return {
      color: this.config.style?.color || "#333",
      weight: 1,
      opacity: 0.6,
      fillOpacity: 0.1,
    };
  }

  _applyHighlightStyle(layer) {
    layer.setStyle({
      color: "#e63946",
      weight: 3,
      opacity: 1,
      fillOpacity: 0.4,
    });
  }

  _applySecondaryStyle(layer) {
    layer.setStyle({
      color: this.config.style?.color || "#999",
      weight: 1,
      opacity: 0.3,
      fillOpacity: 0.05,
      dashArray: "4",
    });
  }
}

// Register the custom element
customElements.define("map-viewer", MapViewer);

// Global error handler for component registration failures
window.addEventListener("error", (e) => {
  if (e.message.includes("customElements")) {
    console.error("Component registration failed:", e);
    // Show a basic UI without web components
    document.body.classList.add("components-failed");
  }
});
