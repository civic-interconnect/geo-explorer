import { STATE_LIST } from "./list-us-states.js";
import { config } from "./config.js";

export function generateCountyLayers() {
  // Grab the config for counties:
  const groupConfig = config.groups["us-counties"];

  // Pull dynamic settings from config:
  const baseUrl = groupConfig.baseUrl;
  const style = groupConfig.style;
  const idProp = groupConfig.idProp;
  const nameProp = groupConfig.nameProp;
  const type = groupConfig.type || "geojson";

  const layers = {};

  for (const state of STATE_LIST) {
    const stateLabel = state
      .split("-")
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(" ");

    layers[state] = {
      label: stateLabel,
      url: `${baseUrl}/${state}/counties.geojson`,
      type,
      style,
      idProp,
      nameProp,
    };
  }

  return layers;
}

// Inject dynamically:
config.groups["us-counties"].layers = generateCountyLayers();
