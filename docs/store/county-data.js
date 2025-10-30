// store/county-data.js
// Keyed the same way as featureData (by layerKey).
const countyData = {};

export function setCountyData(key, countiesArray) {
  countyData[key] = Array.isArray(countiesArray) ? countiesArray : [];
}

export function getCountyData(key) {
  return countyData[key] || [];
}

export function clearCountyData(key) {
  if (key in countyData) delete countyData[key];
}

export function allCountyData() {
  return countyData;
}
