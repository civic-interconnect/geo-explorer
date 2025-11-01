// helpers/events.js
// Event builders for custom events used in the app

/**
 * Builds a CustomEvent for applying precinct filters.
 * @param {Object} param0
 * @param {string|null} param0.county - The selected county.
 * @param {string|null} param0.subdist - The selected subdistrict.
 * @returns {CustomEvent} The constructed CustomEvent.
 */
export function buildPrecinctFilterEvent({ county = null, subdist = null }) {
  return new CustomEvent("apply-precinct-filter", {
    detail: { county, subdist },
    bubbles: true,
    composed: true
  });
}
