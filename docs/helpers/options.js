// helpers/options.js
// Helper functions for processing options from raw feature data
// Does not depend on any other modules

export function uniqueSorted(strings) {
  return Array.from(
    new Set((strings || []).filter(Boolean).map((s) => String(s).trim()))
  ).sort();
}
export function countiesFromRaw(rawFeatures) {
  const vals = (rawFeatures || [])
    .map((f) => f && f.properties && f.properties.county)
    .filter(Boolean);
  return uniqueSorted(vals);
}
