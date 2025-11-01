// app/update-county-options.js

/**
 * Update county options from features
 * @param {HTMLSelectElement} countySelect - The county select element
 * @param {Array} rawFeatures - Raw feature data
 * @param {Function} extractCountiesFn - Function to extract counties
 * @param {Function} buildOptionsFn - Function to build HTML options
 */
export function updateCountyOptions(
  countySelect,
  rawFeatures,
  extractCountiesFn,
  buildOptionsFn
) {
  if (!countySelect) return false;

  const counties = extractCountiesFn(rawFeatures);
  const optionsHTML = buildOptionsFn(counties);
  countySelect.innerHTML = optionsHTML;

  console.log(
    "[DEBUG] updateCountyOptions(): populated %d counties",
    counties.length
  );
  return true;
}
