const CACHE_NAME = "geo-explorer-cache-v0.0.2";
const BASE_PATH = "/geo-explorer/";
const urlsToCache = [
  `${BASE_PATH}`,
  `${BASE_PATH}app-state.js`,
  `${BASE_PATH}config.js`,
  `${BASE_PATH}favicon.ico`,
  `${BASE_PATH}index.html`,
  `${BASE_PATH}index.js`,
  `${BASE_PATH}manifest.json`,
  `${BASE_PATH}styles/index.css`,
  `${BASE_PATH}app/dropdown-01-view.js`,
  `${BASE_PATH}app/dropdown-02-layer.js`,
  `${BASE_PATH}app/dropdown-03-feature.js`,
  `${BASE_PATH}app/layer-cd118.js`,
  `${BASE_PATH}app/layer-counties.js`,
  `${BASE_PATH}app/layer-states.js`,
  `${BASE_PATH}app/list-us-states.js`,
  `${BASE_PATH}app/map-viewer.js`,
  `${BASE_PATH}app/store-feature.js`,
  `${BASE_PATH}components/DropdownControlGroup.js`,
  `${BASE_PATH}components/MapContainer.js`,
  "https://civic-interconnect.github.io/app-core/components/ci-header/ci-header.js",
  "https://civic-interconnect.github.io/app-core/components/ci-footer/ci-footer.js",
  "https://civic-interconnect.github.io/app-core/styles/tokens.css",
  "https://civic-interconnect.github.io/app-core/styles/themes.css",
  "https://civic-interconnect.github.io/app-core/styles/base.css",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
