export const config = {
  groups: {
    "us-states": {
      label: "US States",
      style: { color: "#2b3a67" },
      idProp: "STATEFP",
      nameProp: "NAME",
      layers: {} // dynamically injected
    },
    "us-counties": {
      label: "US Counties",
      style: { color: "#007acc" },
      idProp: "COUNTYFP",
      nameProp: "NAME",
      layers: {} // dynamically injected
    },
    "us-congress": {
      label: "Congressional Districts",
      file: "./data/congress/us-house-118.geojson",
      count: 435,
      style: { color: "#800000" },
      idProp: "CD_ID",
      nameProp: "CD_NAME",
    },
    "us-ocd": {
      label: "Official Civic Divisions",
      file: "./data/ocd/ocd-boundaries.geojson",
      count: 3000,
      style: { color: "#555" },
      idProp: "COUNTYFP",
      nameProp: "NAME",
    },
  },
};
