// components/MapContainer.js

export function MapContainer({ containerId }) {
  const mapDiv = document.createElement("div");
  mapDiv.id = containerId;
  mapDiv.classList.add("map-container");
  return mapDiv;
}
