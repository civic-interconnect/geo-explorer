// helpers/options.js
// Helper functions for processing options from raw feature data

/** Extract unique counties from raw features 
 * @param {Array} rawFeatures - Array of raw feature objects
 * @returns {Array} Sorted array of unique county names
*/
export function extractCounties(rawFeatures) {
  if (!rawFeatures || !Array.isArray(rawFeatures)) return [];
  
  const counties = new Set();
  
  rawFeatures.forEach(feature => {
    const county = feature?.properties?.county;
    if (county) {
      counties.add(String(county).trim());
    }
  });
  
  return Array.from(counties).sort();
}

/** Build HTML options for county dropdown
 * @param {Array} counties - Array of county names
 * @returns {string} HTML string for county options
 */
export function buildCountyOptions(counties) {
  if (!counties || counties.length === 0) {
    return "<option disabled selected>[ Select a County ]</option>";
  }
  
  return (
    "<option disabled selected>[ Select a County ]</option>" +
    counties.map(county => 
      `<option value="${county}">${county}</option>`
    ).join("")
  );
}

/** Extract unique subdistricts for a given county 
 * @param {Array} rawFeatures - Array of raw feature objects
 * @param {string} selectedCounty - The county to filter subdistricts by
 * @returns {Array} Sorted array of unique subdistrict names
*/
export function extractSubdistricts(rawFeatures, selectedCounty) {
  if (!rawFeatures || !Array.isArray(rawFeatures) || !selectedCounty) return [];
  
  const subdistricts = new Set();
  
  rawFeatures
    .filter(feature => {
      const county = feature?.properties?.county;
      return county && String(county).toLowerCase() === String(selectedCounty).toLowerCase();
    })
    .forEach(feature => {
      const subdist = feature?.properties?.subdistrict;
      if (subdist) {
        subdistricts.add(String(subdist).trim());
      }
    });
  
  return Array.from(subdistricts).sort();
}