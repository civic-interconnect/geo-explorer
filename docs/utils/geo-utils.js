// utils/geo-utils.js

export function highlightFeature(featureId) {
  const mapViewer = document.querySelector("map-viewer");
  if (featureId) {
    mapViewer.highlightFeature(featureId, { skipZoom: true });
  }
}

export function filterFeaturesByCountyAndSubdist(features, {
  county,
  subdist,
  countyProp = "county",
  subProp = "subdistrict",
  caseInsensitive = true,
} = {}) {
  if (!Array.isArray(features)) return [];

  const norm = (v) => (v == null ? "" : String(v));
  const toKey = (v) => (caseInsensitive ? norm(v).toLowerCase().trim() : norm(v).trim());

  const wantCounty = county ? toKey(county) : null;
  const wantSub = subdist ? toKey(subdist) : null;

  return features.filter((f) => {
    const props = f?.properties || {};
    const haveCounty = toKey(props[countyProp]);
    const haveSub = toKey(props[subProp]);
    const okCounty = wantCounty ? haveCounty === wantCounty : true;
    const okSub = wantSub ? haveSub === wantSub : true;
    return okCounty && okSub;
  });
}
