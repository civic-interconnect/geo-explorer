// app/update-county-options.js
export function updateCountyOptions(rawFeatures) {
  const countySelect = document.getElementById("county-select");
  if (!countySelect) return;

  const counties = Array.from(
    new Set(
      (rawFeatures || [])
        .map(f => f && f.properties && f.properties.county)
        .filter(Boolean)
        .map(s => String(s).trim())
    )
  ).sort();

  countySelect.innerHTML =
    '<option disabled selected>[ Select a County ]</option>' +
    counties.map(c => `<option value="${c}">${c}</option>`).join("");
}
