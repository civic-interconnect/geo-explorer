// app/layer-mn-precincts.js
// Discover the latest published Minnesota precinct snapshot.

import { config } from "../config.js";

/**
 * Generate the Minnesota precinct layer from the published state index.
 * @returns {Promise<Object>} Available Minnesota precinct layers.
 */
export async function generateMNPrecinctLayers() {
  const group = config.groups["mn-precincts"];
  const baseUrl = group.baseUrl;

  const indexResponse = await fetch(`${baseUrl}/index.json`, {
    cache: "no-store",
  });

  if (!indexResponse.ok) {
    throw new Error(`Minnesota index: HTTP ${indexResponse.status}`);
  }

  const index = await indexResponse.json();
  const latest = index.layers?.find(
    (layer) => layer.id === "mn-precincts",
  )?.latest;

  if (!/^precincts\/\d{4}-\d{2}\/metadata\.json$/.test(latest || "")) {
    throw new Error("Minnesota index has no valid latest precinct snapshot");
  }

  const metadataResponse = await fetch(`${baseUrl}/${latest}`, {
    cache: "no-store",
  });

  if (!metadataResponse.ok) {
    throw new Error(`Minnesota metadata: HTTP ${metadataResponse.status}`);
  }

  const metadata = await metadataResponse.json();
  const filename = metadata.paths?.web_geojson;

  if (!filename || !/^[\w-]+\.geojson$/.test(filename)) {
    throw new Error("Minnesota metadata has no valid web GeoJSON filename");
  }

  const directory = latest.slice(0, latest.lastIndexOf("/"));
  const url = `${baseUrl}/${directory}/${filename}`;

  console.log("[MN precincts] Latest published snapshot:", url);

  return {
    minnesota: {
      label: "Minnesota",
      type: "geojson",
      url,
      idProp: group.idProp,
      nameProp: group.nameProp,
      filterCountyProp: group.filterCountyProp,
      filterSubdistProp: group.filterSubdistProp,
      style: group.style,
    },
  };
}
