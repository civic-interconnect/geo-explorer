// ui/dom-refs.js
export const refs = {
  viewSelect: () => document.getElementById("view-select"),
  layerSelect: () => document.getElementById("layer-select"),
  countySelect: () => document.getElementById("county-select"),
  subdistSelect: () => document.getElementById("subdist-select"),

  countyContainer: () => document.getElementById("county-container"),
  subdistContainer: () => document.getElementById("subdist-container"),

  mapViewer: () => document.querySelector("map-viewer")

  
};
// verify  all are not null
Object.values(refs).forEach((getRef) => {
  const el = getRef();
  if (!el) {
    console.warn("[DOM Refs] Element not found:", getRef);
  }
}); 
console.log("DOM refs initialized");
