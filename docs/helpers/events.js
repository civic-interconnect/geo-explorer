// helpers/events.js
// Event builders for custom events used in the app

export function buildPrecinctFilterEvent({ county = null, subdist = null }) {
  return new CustomEvent("apply-precinct-filter", {
    detail: { county, subdist },
    bubbles: true,
    composed: true
  });
}
