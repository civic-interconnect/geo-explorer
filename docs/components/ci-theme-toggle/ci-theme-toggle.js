/**
 * components/ci-theme-toggle/ci-theme-toggle.js
 * Civic Interconnect App Core
 *
 * Web component to toggle dark/light mode for the entire application.
 *
 * Usage Example:
 *
 *   <ci-theme-toggle></ci-theme-toggle>
 */

const styleURL = new URL('./ci-theme-toggle.css', import.meta.url);
const templateURL = new URL('./ci-theme-toggle.html', import.meta.url);

class CiThemeToggle extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  async connectedCallback() {
    const [style, html] = await Promise.all([
      fetch(styleURL).then((res) => res.text()),
      fetch(templateURL).then((res) => res.text()),
    ]);

    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      ${html}
    `;

    const button = this.shadowRoot.querySelector(".theme-toggle");
    if (button) {
      button.addEventListener("click", () => {
        const currentTheme = document.body.dataset.theme || "light";
        document.body.dataset.theme = currentTheme === "dark" ? "light" : "dark";
      });
    }
  }
}

customElements.define("ci-theme-toggle", CiThemeToggle);
