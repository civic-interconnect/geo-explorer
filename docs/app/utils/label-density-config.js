// app/utils/label-density-config.js
// Centralized label visibility configuration based on feature density

/**
 * Calculate optimal minZoom based on feature count and bounds
 * @param {number} featureCount - Number of features in the layer
 * @param {L.LatLngBounds} bounds - Geographic bounds of the features
 * @param {string} layerType - Type of layer (state, counties, cds, precincts)
 * @returns {number} Recommended minimum zoom level
 */
export function calculateOptimalMinZoom(featureCount, bounds, layerType) {
  // Default zoom levels if bounds not available
  const defaults = {
    state: 4,
    counties: 6,
    cds: 7,
    precincts: 10,
  };

  if (!bounds || !bounds.isValid()) {
    return defaults[layerType] || 8;
  }

  // Calculate approximate area in square degrees
  const latDiff = Math.abs(bounds.getNorth() - bounds.getSouth());
  const lngDiff = Math.abs(bounds.getEast() - bounds.getWest());
  const areaDegrees = latDiff * lngDiff;

  // Calculate density (features per square degree)
  const density = featureCount / areaDegrees;

  // Label density thresholds - tune these values!
  const config = getLabelDensityConfig();

  // Find appropriate zoom based on density
  for (const threshold of config.thresholds) {
    if (density >= threshold.minDensity) {
      return threshold.minZoom;
    }
  }

  // Fallback to layer type default
  return defaults[layerType] || 8;
}

/**
 * Get label density configuration
 * One place to tune label visibility settings
 * @returns {Object} Configuration object
 */
export function getLabelDensityConfig() {
  return {
    // Density thresholds (features per square degree)
    // Ordered from highest density to lowest
    thresholds: [
      {
        minDensity: 1000,
        minZoom: 10,
        description: "Very dense (e.g., all MN precincts)",
      },
      {
        minDensity: 500,
        minZoom: 11,
        description: "Dense (e.g., metro precincts)",
      },
      {
        minDensity: 100,
        minZoom: 10,
        description: "Moderate (e.g., county precincts)",
      },
      {
        minDensity: 50,
        minZoom: 9,
        description: "Light (e.g., rural precincts)",
      },
      {
        minDensity: 20,
        minZoom: 8,
        description: "Sparse (e.g., congressional districts)",
      },
      {
        minDensity: 5,
        minZoom: 7,
        description: "Very sparse (e.g., counties)",
      },
      {
        minDensity: 0,
        minZoom: 6,
        description: "Extremely sparse (e.g., states)",
      },
    ],

    // Maximum labels to show simultaneously
    maxLabelsVisible: 100,

    // Override: Always show labels when filtered (regardless of zoom)
    alwaysShowWhenFiltered: true,

    // Override: Maximum features before disabling labels entirely
    disableLabelsAbove: 1000,

    // Per-layer overrides (optional)
    layerOverrides: {
      state: { minZoom: 4, maxLabelsVisible: 50 },
      counties: { minZoom: 6, maxLabelsVisible: 100 },
      cds: { minZoom: 7, maxLabelsVisible: 50 },
      precincts: { minZoom: 10, maxLabelsVisible: 150 },
    },
  };
}

/**
 * Should labels be shown for this layer?
 * @param {number} featureCount - Number of features
 * @param {number} currentZoom - Current map zoom level
 * @param {number} minZoom - Calculated minimum zoom
 * @param {boolean} isFiltered - Whether layer is currently filtered
 * @returns {boolean}
 */
export function shouldShowLabels(
  featureCount,
  currentZoom,
  minZoom,
  isFiltered = false
) {
  const config = getLabelDensityConfig();
  config.enabled = true;
  console.debug("[label-density] shouldShowLabels:", {
    featureCount,
    currentZoom,
    minZoom,
    isFiltered,
  });

  // Don't show if way too many features
  if (featureCount > config.disableLabelsAbove) {
    // Unless filtered (then show anyway)
    return config.alwaysShowWhenFiltered && isFiltered;
  }

  // Always show when filtered (regardless of zoom)
  if (config.alwaysShowWhenFiltered && isFiltered) {
    return true;
  }

  // Normal zoom-based check
  if (currentZoom >= minZoom) {
    console.debug("[label-density] shouldShowLabels based on zoom: true");
    return true;
  } else {
    console.debug("[label-density] shouldShowLabels based on zoom: false");
    return false;
  }
}

/**
 * Get label visibility settings for a layer
 * @param {number} featureCount
 * @param {L.LatLngBounds} bounds
 * @param {string} layerType
 * @param {boolean} isFiltered
 * @returns {Object} Settings object
 */
export function getLabelSettings(
  featureCount,
  bounds,
  layerType,
  isFiltered = false
) {
  const config = getLabelDensityConfig();
  const minZoom = calculateOptimalMinZoom(featureCount, bounds, layerType);

  // Apply layer-specific overrides
  const override = config.layerOverrides[layerType];

  return {
    minZoom: override?.minZoom ?? minZoom,
    maxLabelsVisible: override?.maxLabelsVisible ?? config.maxLabelsVisible,
    alwaysShow: config.alwaysShowWhenFiltered && isFiltered,
    enabled: featureCount <= config.disableLabelsAbove || isFiltered,
  };
}
