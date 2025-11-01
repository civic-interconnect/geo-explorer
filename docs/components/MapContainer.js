// components/MapContainer.js


/**
 * Creates a map container element.
 * @param {Object} param0 - The parameters for the map container.
 * @param {string} param0.containerId - The ID for the map container.
 * @returns {HTMLElement} The map container element.
 */
export function MapContainer({ containerId }) {
  const mapDiv = document.createElement("div");
  mapDiv.id = containerId;
  mapDiv.classList.add("map-container");
  return mapDiv;
}
