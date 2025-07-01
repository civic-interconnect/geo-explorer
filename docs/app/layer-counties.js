// app/layer-counties.js
// This file generates layers for US counties based on a predefined list and configuration settings.

import { STATE_LIST } from "./list-us-states.js";
import { config } from "../config.js";

export function generateCountyLayers() {
  const groupConfig = config.groups["us-counties"];

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
  //console.log("Generated county layers:", layers);
  return layers;
}

// Inject dynamically:
config.groups["us-counties"].layers = generateCountyLayers();
