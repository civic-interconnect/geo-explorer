import { DropdownControlGroup } from "../components/DropdownControlGroup.js";
import { appState } from "../app-state.js";
import { featureData } from "./store-feature.js";
import { sortByKey} from "https://civic-interconnect.github.io/app-core/utils/ui-utils.js";

import { highlightFeature } from "../utils/geo-utils.js";
import { render } from "../index.js";

export function renderFeatureDropdown() {
  const container = document.getElementById("feature-container");
  if (!container) return;

  const features = featureData[appState.selectedLayer] || [];

  if (features.length <= 1) {
    container.style.display = "none";
    return;
  }

  const featuresMap = features.map(f => ({
    value: f.id,
    label: f.name
  }));

  container.style.display = "flex";

  DropdownControlGroup({
    selectId: "feature-select",
    labelText: "Choose Feature",
    options: sortByKey(featuresMap, "label"),
    value: appState.selectedFeature,
    onChange: (newFeature) => {
      console.log("[dropdown-feature.js] Feature changed:", newFeature);
      appState.selectedFeature = newFeature;
      highlightFeature(newFeature);
      render();
    }
  });
}
