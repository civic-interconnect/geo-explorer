// utils/geo-utils.js

export function highlightFeature(featureId) {
  const mapViewer = document.querySelector("map-viewer");
  if (featureId) {
    mapViewer.highlightFeature(featureId, { skipZoom: true });
  }
}