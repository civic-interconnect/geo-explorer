// app/filters/filter-applier.js
// Apply filter state to map layers

import { matchesSubdistFilter } from "./filter-utils.js";

/**
 * Apply current filter state to map
 * @param {MapViewer} mapViewer - The map viewer instance
 * @param {Object} filterState - Current filter state
 */
export function applyFiltersToMap(mapViewer, filterState) {
  const { highlight, filters, view } = filterState;

  console.log("[FilterApplier] Applying filters:", {
    highlight,
    filters,
    view,
  });

  // Don't filter if not on precincts view
  if (view !== "mn-precincts") {
    // Just apply highlight if present
    if (highlight.type && highlight.value) {
      applyHighlight(mapViewer, highlight);
    } else {
      clearHighlight(mapViewer);
    }
    return;
  }

  // Apply filters to precincts
  let hasVisibleFeatures = false;

  mapViewer.layerGroup.eachLayer((layer) => {
    if (!layer.feature) return;

    const props = layer.feature.properties;
    let show = true;

    // Apply county filter
    if (filters.county && props.county !== filters.county) {
      show = false;
    }

    // Apply subdist filter (includes 3A, 3B for "3")
    if (show && filters.subdist && props.mn_house) {
      show = matchesSubdistFilter(props.mn_house, filters.subdist);
    }

    // Apply single precinct filter
    if (show && filters.precinct && props.mn_house !== filters.precinct) {
      show = false;
    }

    // Style the layer
    if (show) {
      layer.setStyle({
        fillOpacity: 0.5,
        opacity: 1,
        weight: 1,
        color: "#3388ff",
      });
      hasVisibleFeatures = true;
    } else {
      layer.setStyle({
        fillOpacity: 0,
        opacity: 0,
      });
    }
  });

  // Update labels based on filter
  updateLabels(mapViewer, filterState, hasVisibleFeatures);

  // Apply highlight if present (but don't filter by it)
  if (highlight.type === "precinct" && highlight.value) {
    applyPrecinctHighlight(mapViewer, highlight.value);
  } else {
    clearHighlight(mapViewer);
  }
}

/**
 * Apply highlight to a single feature
 */
function applyHighlight(mapViewer, highlight) {
  clearHighlight(mapViewer);

  if (!highlight.type || !highlight.value) return;

  // Normalize comparison helpers using the active layer config
  const idProp = mapViewer.config?.idProp || "id";
  const nameProp = mapViewer.config?.nameProp || "name";
  const equals = (a, b) => String(a) === String(b);

  mapViewer.layerGroup.eachLayer((layer) => {
    if (!layer.feature) return;

    const props = layer.feature.properties;
    let isMatch = false;

    // Prefer idProp / nameProp from layer config, fall back to legacy fields
    if (highlight.type === "state") {
      isMatch =
        equals(props[idProp], highlight.value) ||
        equals(props[nameProp], highlight.value) ||
        equals(props.name, highlight.value);
    } else if (highlight.type === "county") {
      isMatch =
        equals(props[idProp], highlight.value) ||
        equals(props[nameProp], highlight.value) ||
        equals(props.county, highlight.value) ||
        equals(props.name, highlight.value);
    } else if (highlight.type === "cd") {
      isMatch =
        equals(props[idProp], highlight.value) ||
        equals(props[nameProp], highlight.value) ||
        equals(props.cd, highlight.value) ||
        equals(props.name, highlight.value);
    } else if (highlight.type === "precinct") {
      isMatch =
        equals(props[idProp], highlight.value) ||
        equals(props[nameProp], highlight.value) ||
        equals(props.mn_house, highlight.value);
    }

    if (isMatch) {
      layer.setStyle({
        weight: 4,
        color: "#ff0000",
        fillOpacity: 0.7,
      });
      mapViewer.highlightedLayer = layer;

      // Fit bounds on mobile
      if (L.Browser.mobile) {
        mapViewer.map.fitBounds(layer.getBounds(), { padding: [50, 50] });
      }
    }
  });

  //  Filter labels to only show highlighted feature
  if (mapViewer.labelController) {
    mapViewer.labelController.setFilter((layer) => {
      if (!layer.feature) return false;

      const props = layer.feature.properties;

      const matches =
        equals(props[idProp], highlight.value) ||
        equals(props[nameProp], highlight.value) ||
        equals(props.name, highlight.value) ||
        equals(props.county, highlight.value) ||
        equals(props.cd, highlight.value) ||
        equals(props.mn_house, highlight.value);
      return matches;
    });
    mapViewer.labelController.setAlwaysShow(true); // Always show when highlighted
    mapViewer.labelController.rebuild(mapViewer.layerGroup);
  }
}

/**
 * Apply highlight to a single precinct
 */
function applyPrecinctHighlight(mapViewer, precinctId) {
  mapViewer.layerGroup.eachLayer((layer) => {
    if (!layer.feature) return;

    const props = layer.feature.properties;

    if (props.mn_house === precinctId) {
      layer.setStyle({
        weight: 4,
        color: "#ff0000",
        fillOpacity: 0.7,
      });
      mapViewer.highlightedLayer = layer;
    }
  });

  // Hide labels when highlighting a single precinct
  if (mapViewer.labelController) {
    mapViewer.labelController.setHighlighted(true);
  }
}

/**
 * Clear highlight
 */
function clearHighlight(mapViewer) {
  if (mapViewer.highlightedLayer) {
    mapViewer.layerGroup.resetStyle(mapViewer.highlightedLayer);
    mapViewer.highlightedLayer = null;
  }

  // Restore labels
  if (mapViewer.labelController) {
    mapViewer.labelController.setHighlighted(false);
  }
}

/**
 * Update labels based on filter state
 */
function updateLabels(mapViewer, filterState, hasVisibleFeatures) {
  if (!mapViewer.labelController) return;

  const { filters, highlight } = filterState;
  const hasFilter = Object.values(filters).some((v) => v !== null);
  const hasHighlight = highlight.type !== null && highlight.value !== null;

  // Don't update labels here if highlight is active (handled in applyHighlight)
  if (hasHighlight) return;

  // Create filter function for labels
  const filterFn = (layer) => {
    if (!layer.feature) return false;

    const props = layer.feature.properties;

    // Apply county filter
    if (filters.county && props.county !== filters.county) {
      return false;
    }

    // Apply subdist filter
    if (filters.subdist && props.mn_house) {
      if (!matchesSubdistFilter(props.mn_house, filters.subdist)) {
        return false;
      }
    }

    // Apply precinct filter
    if (filters.precinct && props.mn_house !== filters.precinct) {
      return false;
    }

    return true;
  };

  // Update label controller
  mapViewer.labelController.setFilter(hasFilter ? filterFn : null);
  mapViewer.labelController.setAlwaysShow(hasFilter && hasVisibleFeatures);

  // When filtered: force labels on
  // When NOT filtered: show labels by default for non-state layers,
  // so Counties/CDs display labels without needing a filter.
  const isStateLayer = mapViewer.config?.type === "state";
  const baseAlwaysShow = !isStateLayer;
  mapViewer.labelController.setAlwaysShow(hasFilter ? true : baseAlwaysShow);

  mapViewer.labelController.rebuild(mapViewer.layerGroup);
}
