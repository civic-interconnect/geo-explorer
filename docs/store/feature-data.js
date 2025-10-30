// store/feature-data.js
// Wrapper for existing feature data storage

export const featureData = {};

export function setFeatureData(key, features) {
  featureData[key] = Array.isArray(features) ? features : [];
}

export function getFeatureData(key) {
  return featureData[key] || [];
}
