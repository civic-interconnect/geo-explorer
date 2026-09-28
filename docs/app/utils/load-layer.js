// Load a layer with optimizations for large datasets
// app/utils/load-layer.js

import { getLabelSettings } from "./label-density-config.js";

/**
 * Load layer implementation
 * Called with MapViewer instance as context
 */
export async function loadLayerImpl(mapViewer, config, options = {}) {
  console.log("[load-layer] Loading layer with optimizations:", config);

  // Show loading state
  mapViewer._showLoading();

  const isStateLevel =
    config.type === "state" || config.url.includes("/state.geojson");
  const isSubdivision = ["counties", "cds", "precincts"].includes(config.type);

  // Clear existing data efficiently
  mapViewer._clearLayers();

  mapViewer.config = {
    filterCountyProp: "county",
    filterSubdistProp: "subdistrict",
    ...config,
  };

  try {
    const url = config.url;
    if (!url) throw new Error("Layer config missing 'url' property!");

    // Check cache first
    const cacheKey = `geojson_${url}`;
    let geojson = mapViewer._featureCache.get(cacheKey);

    if (!geojson) {
      console.log("[load-layer] Fetching GeoJSON from:", url);

      // Add timeout for slow networks
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(url, {
        signal: controller.signal,
        cache: "default", // Use browser cache
      });

      clearTimeout(timeoutId);

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      geojson = await response.json();

      // Cache the result
      mapViewer._featureCache.set(cacheKey, geojson);

      // Simplify geometries for large datasets
      if (geojson.features.length > 1000) {
        console.log("[load-layer] Simplifying large dataset...");
        // TODO: Consider using turf.js simplify here
      }
    } else {
      console.log("[load-layer] Using cached GeoJSON");
    }

    console.log("[load-layer] GeoJSON loaded, features count:", geojson.features.length);

    // Process features
    mapViewer._fullFeatureCollection = geojson;
    mapViewer._lastFeaturesFlat = Array.isArray(geojson.features)
      ? geojson.features
      : [];

    // Extract unique features efficiently
    const uniqueFeatures = new Map();
    for (const f of mapViewer._lastFeaturesFlat) {
      const id = f.properties[mapViewer.config.idProp];
      if (!uniqueFeatures.has(id)) {
        const name = f.properties[mapViewer.config.nameProp];
        uniqueFeatures.set(id, { id, name });
      }
    }
    mapViewer.features = Array.from(uniqueFeatures.values());

    // Add data progressively for large datasets
    if (mapViewer._lastFeaturesFlat.length > 500 && !mapViewer._isMobile) {
      await mapViewer._addDataProgressively(geojson);
    } else {
      mapViewer.layerGroup.addData(geojson);
    }

    // smart labels
    if (mapViewer.labelController) {
      const shouldShowLabels = config.type !== "state";

      if (shouldShowLabels) {
        const bounds = mapViewer.layerGroup.getBounds();
        const settings = getLabelSettings(
          mapViewer._lastFeaturesFlat.length,
          bounds,
          config.type,
          false
        );

        console.log(`[load-layer] Label settings for ${config.type}:`, settings);

        mapViewer.labelController.nameProp =
          mapViewer.config.nameProp || "name";
        mapViewer.labelController.minZoom = settings.minZoom;
        mapViewer.labelController.maxLabels = settings.maxLabelsVisible;
        mapViewer.labelController.useColorCoding = config.type === "precincts";

        if (settings.enabled) {
          mapViewer.labelController.buildLabels(mapViewer.layerGroup);
          mapViewer.labelController.enable();
        } else {
          console.log(
            `[load-layer] Labels disabled: too many features (${mapViewer._lastFeaturesFlat.length})`
          );
        }
      } else {
        // Disable labels for states
        mapViewer.labelController.disable();
        console.log("[load-layer] Labels disabled for state layer");
      }
    }

    // Handle bounds
    const bounds = mapViewer.layerGroup.getBounds();
    if (
      !options.skipFitBounds &&
      bounds.isValid() &&
      geojson.features.length > 0
    ) {
      mapViewer._handleBounds(bounds, isStateLevel, isSubdivision);
    }

    // Invalidate size after data load
    mapViewer._debouncedInvalidateSize();

    // Dispatch event
    mapViewer.dispatchEvent(
      new CustomEvent("features-loaded", {
        detail: {
          features: mapViewer.features,
          rawFeatures: mapViewer._lastFeaturesFlat,
        },
        bubbles: true,
        composed: true,
      })
    );
  } catch (err) {
    console.error("Failed to load layer:", err);
    mapViewer._showError("Failed to load layer data: " + err.message);
  } finally {
    mapViewer._hideLoading();
  }
}
