// app/filters/filter-applier.js
// Apply filter state to map layers.

import { matchesSubdistFilter } from "./filter-utils.js";

/**
 * Apply current filter state to the map.
 * @param {MapViewer} mapViewer - The map viewer instance.
 * @param {Object} filterState - Current filter state.
 */
export function applyFiltersToMap(mapViewer, filterState) {
  const { highlight, filters, view } = filterState;

  console.log("[FilterApplier] Applying filters:", {
    highlight,
    filters,
    view,
  });

  // Other datasets retain their existing highlight behavior.
  if (view !== "mn-precincts") {
    mapViewer._lastFittedPrecinctFilterKey = null;

    if (highlight.type && highlight.value) {
      applyHighlight(mapViewer, highlight);
    } else {
      clearHighlight(mapViewer);
    }
    return;
  }

  // Apply county, legislative district, and optional precinct filters.
  let hasVisibleFeatures = false;
  let visibleBounds = null;

  mapViewer.layerGroup.eachLayer((layer) => {
    if (!layer.feature) return;

    const props = layer.feature.properties;
    let show = true;

    // County filter.
    if (filters.county && props.county !== filters.county) {
      show = false;
    }

    // Legislative district filter.
    // For example, 03 includes 03A and 03B.
    if (show && filters.subdist) {
      show = matchesSubdistFilter(
        props.mn_house ?? "",
        filters.subdist,
      );
    }

    // Individual precinct filter, using precinct identity.
    if (
      show &&
      filters.precinct &&
      String(props.precinct_id) !== String(filters.precinct)
    ) {
      show = false;
    }

    if (show) {
      layer.setStyle({
        fillOpacity: 0.5,
        opacity: 1,
        weight: 1,
        color: "#3388ff",
      });

      hasVisibleFeatures = true;

      // Collect bounds for the selected county or district.
      const bounds = layer.getBounds?.();

      if (bounds?.isValid()) {
        if (visibleBounds) {
          visibleBounds.extend(bounds);
        } else {
          visibleBounds = bounds;
        }
      }
    } else {
      layer.setStyle({
        fillOpacity: 0,
        opacity: 0,
      });
    }
  });

  // Zoom only when the geographic filter changes.
  // Selecting a precinct to highlight will not repeatedly reset the view.
  const hasGeographicFilter = Boolean(
    filters.county || filters.subdist || filters.precinct,
  );

  if (hasGeographicFilter) {
    const filterKey = JSON.stringify([
      filters.county,
      filters.subdist,
      filters.precinct,
    ]);

    if (
      visibleBounds?.isValid() &&
      mapViewer._lastFittedPrecinctFilterKey !== filterKey
    ) {
      mapViewer._lastFittedPrecinctFilterKey = filterKey;

      mapViewer.map.fitBounds(visibleBounds, {
        padding: [20, 20],
        maxZoom: 10,
      });
    }
  } else {
    mapViewer._lastFittedPrecinctFilterKey = null;
  }

  // Update labels using the active geographic filters.
  updateLabels(mapViewer, filterState, hasVisibleFeatures);

  // Outline the selected precinct without discarding the
  // county and legislative district filters.
  if (highlight.type === "precinct" && highlight.value) {
    applyPrecinctHighlight(mapViewer, highlight.value, filters);
  } else {
    // All precinct layers have already been restyled above.
    mapViewer.highlightedLayer = null;

    if (mapViewer.labelController) {
      mapViewer.labelController.setHighlighted(false);
    }
  }
}

/**
 * Apply a highlight to a feature in a non-precinct dataset.
 */
function applyHighlight(mapViewer, highlight) {
  clearHighlight(mapViewer);

  if (!highlight.type || !highlight.value) return;

  const idProp = mapViewer.config?.idProp || "id";
  const nameProp = mapViewer.config?.nameProp || "name";
  const equals = (a, b) => String(a) === String(b);

  mapViewer.layerGroup.eachLayer((layer) => {
    if (!layer.feature) return;

    const props = layer.feature.properties;
    let isMatch = false;

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
        equals(props.precinct_id, highlight.value);
    }

    if (isMatch) {
      layer.setStyle({
        weight: 4,
        color: "#ff0000",
        fillOpacity: 0.7,
      });

      mapViewer.highlightedLayer = layer;

      if (L.Browser.mobile) {
        mapViewer.map.fitBounds(layer.getBounds(), {
          padding: [50, 50],
        });
      }
    }
  });

  if (mapViewer.labelController) {
    mapViewer.labelController.setFilter((layer) => {
      if (!layer.feature) return false;

      const props = layer.feature.properties;

      return (
        equals(props[idProp], highlight.value) ||
        equals(props[nameProp], highlight.value) ||
        equals(props.name, highlight.value) ||
        equals(props.county, highlight.value) ||
        equals(props.cd, highlight.value) ||
        equals(props.precinct_id, highlight.value)
      );
    });

    mapViewer.labelController.setAlwaysShow(true);
    mapViewer.labelController.rebuild(mapViewer.layerGroup);
  }
}

/**
 * Outline every geometry part of the selected precinct.
 * Only highlight it if it belongs to the active county and district.
 */
function applyPrecinctHighlight(mapViewer, precinctId, filters) {
  mapViewer.highlightedLayer = null;

  mapViewer.layerGroup.eachLayer((layer) => {
    if (!layer.feature) return;

    const props = layer.feature.properties;

    if (String(props.precinct_id) !== String(precinctId)) {
      return;
    }

    if (filters.county && props.county !== filters.county) {
      return;
    }

    if (
      filters.subdist &&
      !matchesSubdistFilter(props.mn_house ?? "", filters.subdist)
    ) {
      return;
    }

    layer.setStyle({
      weight: 4,
      color: "#ff0000",
      opacity: 1,
      fillOpacity: 0.7,
    });

    mapViewer.highlightedLayer = layer;
  });

  if (mapViewer.labelController) {
    mapViewer.labelController.setHighlighted(true);
  }
}

/**
 * Clear the previous highlight.
 */
function clearHighlight(mapViewer) {
  if (mapViewer.highlightedLayer) {
    mapViewer.layerGroup.resetStyle(mapViewer.highlightedLayer);
    mapViewer.highlightedLayer = null;
  }

  if (mapViewer.labelController) {
    mapViewer.labelController.setHighlighted(false);
  }
}

/**
 * Update map labels using the active filters.
 */
function updateLabels(mapViewer, filterState, hasVisibleFeatures) {
  if (!mapViewer.labelController) return;

  const { filters, highlight } = filterState;
  const hasFilter = Object.values(filters).some((v) => v !== null);
  const hasHighlight =
    highlight.type !== null && highlight.value !== null;

  // Precinct highlighting is handled separately.
  if (hasHighlight) return;

  const filterFn = (layer) => {
    if (!layer.feature) return false;

    const props = layer.feature.properties;

    if (filters.county && props.county !== filters.county) {
      return false;
    }

    if (
      filters.subdist &&
      !matchesSubdistFilter(props.mn_house ?? "", filters.subdist)
    ) {
      return false;
    }

    if (
      filters.precinct &&
      String(props.precinct_id) !== String(filters.precinct)
    ) {
      return false;
    }

    return true;
  };

  mapViewer.labelController.setFilter(hasFilter ? filterFn : null);

  const isStateLayer = mapViewer.config?.type === "state";
  const baseAlwaysShow = !isStateLayer;

  mapViewer.labelController.setAlwaysShow(
    hasFilter ? hasVisibleFeatures : baseAlwaysShow,
  );

  mapViewer.labelController.rebuild(mapViewer.layerGroup);
}
