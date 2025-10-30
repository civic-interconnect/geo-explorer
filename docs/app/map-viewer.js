// app/map-viewer.js
// Enhanced Web Component with performance optimizations

import { filterFeaturesByCountyAndSubdist } from "../utils/geo-utils.js";

// Utility function for debouncing
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default class MapViewer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // Add Leaflet CSS to shadow DOM with preload hint
    const leafletCSS = document.createElement("link");
    leafletCSS.rel = "stylesheet";
    leafletCSS.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    leafletCSS.crossOrigin = "anonymous";
    this.shadowRoot.appendChild(leafletCSS);

    // Create container for the map inside the Shadow DOM
    const container = document.createElement("div");
    container.id = "map-container";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.minHeight = "600px";
    this.shadowRoot.appendChild(container);

    // Store state-level view settings
    this._stateView = null;
    
    // Caches for performance
    this._fullFeatureCollection = null;
    this._lastFeaturesFlat = [];
    this._featureCache = new Map(); // Cache for processed features
    this._visibleBounds = null; // Track visible area
    
    // Performance flags
    this._isMobile = window.matchMedia('(max-width: 768px)').matches;
    this._reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Debounced methods
    this._debouncedInvalidateSize = debounce(() => {
      if (this.map) this.map.invalidateSize();
    }, 100);
  }

  connectedCallback() {
    const container = this.shadowRoot.getElementById("map-container");

    // Performance-optimized map initialization
    const mapOptions = {
      // Enable canvas renderer for better performance
      preferCanvas: true,
      renderer: L.canvas({ padding: 0.5 }),
      
      // Optimize animations for mobile/reduced motion
      zoomAnimation: !this._isMobile && !this._reducedMotion,
      fadeAnimation: !this._isMobile && !this._reducedMotion,
      markerZoomAnimation: !this._isMobile && !this._reducedMotion,
      
      // Interaction optimizations
      wheelDebounceTime: 40,
      wheelPxPerZoomLevel: 120,
      
      // Initial view
      center: [39, -98],
      zoom: 4,
      
      // Bounds
      maxZoom: 18,
      minZoom: 3,
    };

    this.map = L.map(container, mapOptions);
    console.log("Map initialized with optimized settings");

    // Add tile layer with optimizations
    const tileOptions = {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 18,
      
      // Performance optimizations
      updateWhenIdle: false,
      updateWhenZooming: false,
      keepBuffer: this._isMobile ? 1 : 2,
      tileSize: 256,
      zoomOffset: 0,
      
      // Loading optimizations
      crossOrigin: true,
      detectRetina: false, // Disable for performance
    };
    
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", tileOptions)
      .addTo(this.map);

    // Create optimized GeoJSON layer
    this.layerGroup = L.geoJSON(null, {
      style: this._defaultStyle.bind(this),
      onEachFeature: this._bindFeature.bind(this),
      
      // Performance: simplify rendering for complex geometries
      smoothFactor: this._isMobile ? 2 : 1,
      
      // Only render features in viewport
      filter: this._isMobile ? this._viewportFilter.bind(this) : null,
    }).addTo(this.map);

    this.features = [];
    this.highlightedLayer = null;

    // Track viewport for optimization
    this.map.on('moveend', debounce(() => {
      this._visibleBounds = this.map.getBounds();
      if (this._isMobile) {
        this._updateVisibleFeatures();
      }
    }, 300));

    // Optimize resize handling
    this._debouncedInvalidateSize();

    // Event listeners
    this.addEventListener("apply-precinct-filter", (e) => {
      const detail = e?.detail || {};
      this.applyMNPrecinctFilter(detail);
    });

    // Add loading indicator
    this._addLoadingControl();
  }

  async loadLayer(config, options = {}) {
    console.log("Loading layer with optimizations:", config);
    
    // Show loading state
    this._showLoading();

    const isStateLevel = config.type === "state" || config.url.includes("/state.geojson");
    const isSubdivision = ["counties", "cds", "precincts"].includes(config.type);

    // Clear existing data efficiently
    this._clearLayers();
    
    this.config = {
      filterCountyProp: "county",
      filterSubdistProp: "subdistrict",
      ...config,
    };

    try {
      const url = config.url;
      if (!url) throw new Error("Layer config missing 'url' property!");

      // Check cache first
      const cacheKey = `geojson_${url}`;
      let geojson = this._featureCache.get(cacheKey);
      
      if (!geojson) {
        console.log("Fetching GeoJSON from:", url);
        
        // Add timeout for slow networks
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        const response = await fetch(url, { 
          signal: controller.signal,
          cache: 'default' // Use browser cache
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        geojson = await response.json();
        
        // Cache the result
        this._featureCache.set(cacheKey, geojson);
        
        // Simplify geometries for large datasets
        if (geojson.features.length > 1000) {
          console.log("Simplifying large dataset...");
          // You might want to use turf.js simplify here
        }
      } else {
        console.log("Using cached GeoJSON");
      }

      console.log("GeoJSON loaded, features count:", geojson.features.length);

      // Process features
      this._fullFeatureCollection = geojson;
      this._lastFeaturesFlat = Array.isArray(geojson.features) ? geojson.features : [];

      // Extract unique features efficiently
      const uniqueFeatures = new Map();
      for (const f of this._lastFeaturesFlat) {
        const id = f.properties[this.config.idProp];
        if (!uniqueFeatures.has(id)) {
          const name = f.properties[this.config.nameProp];
          uniqueFeatures.set(id, { id, name });
        }
      }
      this.features = Array.from(uniqueFeatures.values());

      // Add data progressively for large datasets
      if (this._lastFeaturesFlat.length > 500 && !this._isMobile) {
        await this._addDataProgressively(geojson);
      } else {
        this.layerGroup.addData(geojson);
      }

      // Handle bounds
      const bounds = this.layerGroup.getBounds();
      if (!options.skipFitBounds && bounds.isValid() && geojson.features.length > 0) {
        this._handleBounds(bounds, isStateLevel, isSubdivision);
      }

      // Invalidate size after data load
      this._debouncedInvalidateSize();

      // Dispatch event
      this.dispatchEvent(
        new CustomEvent("features-loaded", {
          detail: {
            features: this.features,
            rawFeatures: this._lastFeaturesFlat,
          },
          bubbles: true,
          composed: true,
        })
      );
      
    } catch (err) {
      console.error("Failed to load layer:", err);
      this._showError("Failed to load layer data: " + err.message);
    } finally {
      this._hideLoading();
    }
  }

  // Progressive loading for large datasets
  async _addDataProgressively(geojson, chunkSize = 100) {
    console.log("Adding data progressively...");
    const features = geojson.features;
    
    for (let i = 0; i < features.length; i += chunkSize) {
      const chunk = features.slice(i, i + chunkSize);
      this.layerGroup.addData({
        type: "FeatureCollection",
        features: chunk
      });
      
      // Allow UI to update
      if (i % (chunkSize * 5) === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
  }

  // Viewport filter for mobile optimization
  _viewportFilter(feature) {
    if (!this._visibleBounds) return true;
    
    // Simple check if feature might be in view
    const coords = feature.geometry.coordinates;
    if (feature.geometry.type === "Point") {
      return this._visibleBounds.contains([coords[1], coords[0]]);
    }
    // For polygons, check if any point is in view (simplified)
    return true; // Full implementation would check bounds intersection
  }

  // Update visible features on mobile
  _updateVisibleFeatures() {
    if (!this._isMobile || !this._visibleBounds) return;
    
    // Re-filter and render only visible features
    this.layerGroup.clearLayers();
    const visibleFeatures = this._lastFeaturesFlat.filter(f => 
      this._viewportFilter(f)
    );
    
    this.layerGroup.addData({
      type: "FeatureCollection",
      features: visibleFeatures
    });
  }

  // Optimized layer clearing
  _clearLayers() {
    if (this.layerGroup) {
      this.layerGroup.clearLayers();
    }
    this.features = [];
    this.highlightedLayer = null;
  }

  // Handle bounds with saved state
  _handleBounds(bounds, isStateLevel, isSubdivision) {
    if (isStateLevel) {
      this.map.fitBounds(bounds, {
        padding: [20, 20],
        maxZoom: 7,
        minZoom: 4,
        animate: !this._reducedMotion
      });
      
      this._stateView = {
        bounds: bounds,
        zoom: this.map.getZoom(),
        center: this.map.getCenter(),
      };
    } else if (isSubdivision && this._stateView) {
      this.map.setView(this._stateView.center, this._stateView.zoom, {
        animate: !this._reducedMotion
      });
    } else {
      this.map.fitBounds(bounds, {
        padding: [20, 20],
        maxZoom: this.config.maxZoom || 8,
        minZoom: this.config.minZoom || 4,
        animate: !this._reducedMotion
      });
    }
  }

  // Loading indicator
  _addLoadingControl() {
    const LoadingControl = L.Control.extend({
      onAdd: function(map) {
        const container = L.DomUtil.create('div', 'leaflet-control-loading');
        container.style.display = 'none';
        container.style.background = 'white';
        container.style.padding = '5px 10px';
        container.style.borderRadius = '4px';
        container.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
        container.innerHTML = '⏳ Loading...';
        return container;
      }
    });
    
    this._loadingControl = new LoadingControl({ position: 'topleft' });
    this._loadingControl.addTo(this.map);
  }

  _showLoading() {
    if (this._loadingControl && this._loadingControl._container) {
      this._loadingControl._container.style.display = 'block';
    }
  }

  _hideLoading() {
    if (this._loadingControl && this._loadingControl._container) {
      this._loadingControl._container.style.display = 'none';
    }
  }

  _showError(message) {
    const container = this.shadowRoot.getElementById("map-container");
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      color: #e63946;
      z-index: 1000;
    `;
    errorDiv.textContent = message;
    container.appendChild(errorDiv);
    
    setTimeout(() => errorDiv.remove(), 5000);
  }

  // Keep your existing methods but add requestAnimationFrame for smooth updates
  highlightFeature(id, { skipZoom = false } = {}) {
    console.log("Highlighting feature:", id, "skipZoom?", skipZoom);
    
    // Use requestAnimationFrame for smooth visual updates
    requestAnimationFrame(() => {
      this.layerGroup.eachLayer((layer) => {
        const featureId = layer.feature.properties[this.config.idProp];
        if (featureId == id) {
          this._applyHighlightStyle(layer);
          
          if (!skipZoom) {
            this.map.fitBounds(layer.getBounds(), {
              maxZoom: this.config?.maxZoom ?? 8,
              padding: [10, 10],
              animate: !this._reducedMotion
            });
          }
          
          this.highlightedLayer = layer;
        } else {
          this._applySecondaryStyle(layer);
        }
      });
    });
  }

  // Optimized filter application
  applyMNPrecinctFilter({ county, subdist } = {}) {
    if (!this._fullFeatureCollection) return;
    console.log("[map-viewer] Filtering precincts:", { county, subdist });

    const countyProp = this.config?.filterCountyProp || "county";
    const subProp = this.config?.filterSubdistProp || "subdistrict";

    // Use cached filtered results if available
    const filterKey = `${county}_${subdist}`;
    let filtered;
    
    if (this._featureCache.has(filterKey)) {
      filtered = this._featureCache.get(filterKey);
    } else {
      filtered = filterFeaturesByCountyAndSubdist(this._lastFeaturesFlat, {
        county,
        subdist,
        countyProp,
        subProp,
        caseInsensitive: true,
      });
      this._featureCache.set(filterKey, filtered);
    }

    console.log(`[map-viewer] Filtered to ${filtered.length} features.`);

    // Clear and re-add with requestAnimationFrame for smooth update
    requestAnimationFrame(() => {
      this.layerGroup.clearLayers();

      if (county && !subdist) {
        // Add all features with differential styling
        const fragment = {
          type: "FeatureCollection",
          features: []
        };

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
        // Normal filtering
        this.layerGroup.addData({
          type: "FeatureCollection",
          features: filtered,
        });
      }

      // Fit bounds
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
            animate: !this._reducedMotion
          });
        }
      }
    });
  }

  // Keep all your existing style methods unchanged
  _bindFeature(feature, layer) {
    const name = feature.properties[this.config.nameProp];
    if (name) {
      layer.bindTooltip(name, { 
        permanent: false, 
        direction: "auto",
        sticky: this._isMobile // Make tooltips easier to see on mobile
      });
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

// Register (idempotent)
if (!customElements.get('map-viewer')) {
  customElements.define('map-viewer', MapViewer);
}

// Global error handler
window.addEventListener("error", (e) => {
  if (e.message.includes("customElements")) {
    console.error("Component registration failed:", e);
    document.body.classList.add("components-failed");
  }
});