import { STATE_LIST } from "./list-us-states.js";
import { config } from "./config.js";

export function generateStateLayers() {
  const baseUrl  =
    "https://raw.githubusercontent.com/civic-interconnect/civic-data-boundaries-us/main/data-out/states";

  const layers = {};

  for (const state of STATE_LIST) {
    const stateLabel = state
      .split("-")
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(" ");

    layers[state] = {
  label: stateLabel,
      url: `${baseUrl}/${state}/state.geojson`,
      type: "geojson",
      style: { color: "#2b3a67" },
      idProp: "STATEFP",
      nameProp: "NAME",
    };
  }

  return layers;
}

// Inject dynamically
config.groups["us-states"].layers = generateStateLayers();
