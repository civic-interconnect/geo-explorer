// app/layer-mn-precincts.js
// One statewide precincts layer for Minnesota

// app/layer-mn-precincts.js
// One statewide precincts layer for Minnesota

import { config } from "../config.js";

export function generateMNPrecinctLayers() {
  const groupConfig = config.groups["mn-precincts"];

  const baseUrl =
    groupConfig.baseUrl ||
    "https://raw.githubusercontent.com/civic-interconnect/civic-data-boundaries-us-mn-precincts/refs/heads/main/data-out/states/minnesota/precincts";
  const version = "2025-04"; 
  const url = `${baseUrl}/${version}/mn-precincts-web.geojson`;

  const style = groupConfig.style || { color: "#0b79d0" };
  const idProp = groupConfig.idProp || "precinct_id";
  const nameProp = groupConfig.nameProp || "precinct_name";

  const layers = {
    minnesota: {
      label: "Minnesota",
      type: groupConfig.type || "geojson",
      url,
      idProp,
      nameProp,
      filterCountyProp: "county",
      filterSubdistProp: "mn_house",
      style,
    },
  };

  return layers;
}

// Inject dynamically so available before index.js runs
config.groups["mn-precincts"].layers = generateMNPrecinctLayers();
