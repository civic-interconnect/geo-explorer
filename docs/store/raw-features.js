// store/raw-features.js
let _raw = [];
export function setRawFeatures(arr) { _raw = Array.isArray(arr) ? arr : []; }
export function getRawFeatures() { return _raw; }
