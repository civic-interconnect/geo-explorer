import { STATE_LIST } from "./list-us-states.js";
import { config } from "./config.js";

export function generateStateLayers() {
  const groupConfig = config.groups["us-states"];

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
      url: `${baseUrl}/${state}/state.geojson`,
      type,
      style,
      idProp,
      nameProp,
    };
  }

  return layers;
}

// Dynamically populate config:
config.groups["us-states"].layers = generateStateLayers();