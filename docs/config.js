// app/config.js
// This file defines the configuration for US geographic boundaries, including states, counties, and congressional districts.

export const config = {
  groups: {
    "us-states": {
      label: "US States",
      style: { color: "#2b3a67" },
      file: "https://raw.githubusercontent.com/civic-interconnect/civic-data-boundaries-us/main/data-out/national/states.geojson",
      baseUrl:
        "https://raw.githubusercontent.com/civic-interconnect/civic-data-boundaries-us/main/data-out/states",
      idProp: "STATEFP",
      nameProp: "NAME",
      layers: {}
    },
    "us-counties": {
      label: "US Counties",
      style: { color: "#007acc" },
      file: "https://raw.githubusercontent.com/civic-interconnect/civic-data-boundaries-us/main/data-out/national/counties.geojson",
      baseUrl:
        "https://raw.githubusercontent.com/civic-interconnect/civic-data-boundaries-us/main/data-out/states",
      idProp: "COUNTYFP",
      nameProp: "NAME",
      layers: {}
    },
    "us-congress": {
      label: "Congressional Districts",
      style: { color: "#d62728" },
      file: "https://raw.githubusercontent.com/civic-interconnect/civic-data-boundaries-us-cd118/main/data-out/national/cd118_us.geojson",
      baseUrl:
        "https://raw.githubusercontent.com/civic-interconnect/civic-data-boundaries-us-cd118/main/data-out/states",
      idProp: "CD118FP",
      nameProp: "NAMELSAD20",
      layers: {}
    },
    "mn-precincts": {
      label: "MN Precincts",
      idProp: "PrecinctID",    
      nameProp: "precinct_name",
      style: { color: "#0b79d0" },
      layers: {}
    }
  },
};
// county - all lowercase
// MNLEGDIST — Minnesota house district number. 
// PCTNAME — Precinct name.
// name or NAME
// PrecinctID, precinctid