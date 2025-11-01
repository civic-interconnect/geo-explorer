// app/layer-states.js
// This file generates layers for US states based on a predefined list and configuration settings.

import { STATE_LIST } from "./list-us-states.js";
import { config } from "../config.js";


/**
 * Generates layers for US states for all states.
 * @returns {Object} The generated layers for each state.
 */
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

    const stateFolder = state.replace(/-/g, "_");

    layers[state] = {
      label: stateLabel,
      url: `${baseUrl}/${stateFolder}/state.geojson`,
      type,
      style,
      idProp,
      nameProp,
    };
  }
  //console.log("Generated state layers:", layers);
  return layers;
}

// Dynamically populate config:
config.groups["us-states"].layers = generateStateLayers();
