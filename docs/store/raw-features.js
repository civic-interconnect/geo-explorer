// store/raw-features.js
let currentRawFeatures = [];

export function setRawFeatures(features) {
  currentRawFeatures = features;
}

export function getRawFeatures() {
  return currentRawFeatures;
}