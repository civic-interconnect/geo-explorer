import { createSlotSpan } from "./ui-utils.js";

export function patchFooterStatus(statusUrl = "status.json") {
  fetch(statusUrl)
    .then((res) => res.json())
    .then((data) => {
      const footer = document.querySelector("ci-footer");
      if (footer) {
        footer
          .querySelector('[slot="version"]')
          ?.replaceWith(
            createSlotSpan(
              "version",
              `Version: ${data.dashboard_version || "—"}`
            )
          );
        footer
          .querySelector('[slot="updated"]')
          ?.replaceWith(
            createSlotSpan("updated", `Updated: ${data.generated || "—"}`)
          );
      }
    })
    .catch((error) => console.error("Failed to load status.json:", error));
}
