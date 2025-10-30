// ui/visibility.js
export function applyViewVisibility(selectedView, { countyContainer, subdistContainer } = {}) {
  const countyEl = countyContainer ? countyContainer() : document.getElementById("county-container");
  const subdistEl = subdistContainer ? subdistContainer() : document.getElementById("subdist-container");
  const isMN = selectedView === "mn-precincts";

  if (countyEl) countyEl.style.display = isMN ? "flex" : "none";
  if (subdistEl) subdistEl.style.display = isMN ? "flex" : "none";
}
