// app/layer-cd118.js
// This file generates layers for US congressional districts (CD118) based on a predefined list and

import { STATE_LIST } from "./list-us-states.js";
import { config } from "../config.js";

export function generateCD118Layers() {
  const groupConfig = config.groups["us-congress"];

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

    const stateFolder = state.replace(/-/g, "_");

    layers[state] = {
      label: stateLabel,
      url: `${baseUrl}/${stateFolder}/cd118_${stateFolder}.geojson`,
      type,
      style,
      idProp,
      nameProp,
    };
  }
  //console.log("Generated congressional district layers:", layers);
  return layers;
}

// Inject dynamically
config.groups["us-congress"].layers = generateCD118Layers();
