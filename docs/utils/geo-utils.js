// utils/geo-utils.js

export function highlightFeature(featureId) {
  const mapViewer = document.querySelector("map-viewer");
  if (featureId) {
    mapViewer.highlightFeature(featureId, { skipZoom: true });
  }
}

export function highlightCounty(countyId) {
  const mapViewer = document.querySelector("map-viewer");
  if (countyId) {
    mapViewer.highlightCounty(countyId, { skipZoom: true });
  }
}

// utils/geo-utils.js
export function filterFeaturesByCountyAndSubdist(features, options = {}) {
  const {
    county,
    subdist,
    countyProp = "county",
    subProp = "mn_house",
    caseInsensitive = true,
  } = options;

  console.log("[geo-utils] Filtering with:", {
    county,
    subdist,
    countyProp,
    subProp,
  });

  return features.filter((f) => {
    const props = f.properties || {};

    // Check county match
    if (county) {
      const featureCounty = props[countyProp];
      if (!featureCounty) {
        console.log(
          "[geo-utils] Feature missing `county` property:",
          countyProp,
          props
        );
        return false;
      }

      const match = caseInsensitive
        ? featureCounty.toLowerCase() === county.toLowerCase()
        : featureCounty === county;

      if (!match) return false;
    }

    // Check subdist match
    if (subdist) {
      const featureSubdist = props[subProp];
      const match = caseInsensitive
        ? featureSubdist?.toLowerCase() === subdist.toLowerCase()
        : featureSubdist === subdist;

      if (!match) return false;
    }

    return true;
  });
}
