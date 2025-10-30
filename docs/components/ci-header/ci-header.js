/**
 * components/ci-header/ci-header.js
 * Civic Interconnect App Core
 *
 * Web component for a shared Civic Interconnect header.
 *
 * This header provides standardized application titles and subtitles,
 * enabling consistent branding and structure across Civic Interconnect apps.
 *
 * Default values are provided, but client apps can override
 * any content via:
 *   - attributes
 *   - slotted elements
 *
 * Usage Example:
 *
 *   <ci-header
 *     title="Geo Explorer"
 *     subtitle="Visualization and Mapping Tools"
 *   ></ci-header>
 *
 * Or:
 *
 *   <ci-header>
 *     <span slot="title">Geo Explorer</span>
 *     <span slot="subtitle">Mapping & Visualization Tools</span>
 *   </ci-header>
 */

const styleURL = new URL('./ci-header.css', import.meta.url);
const templateURL = new URL('./ci-header.html', import.meta.url);

/**
 * Defines the <ci-header> web component.
 */
class CiHeader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  /**
   * Loads the template and CSS, and fills slots with
   * attribute-based defaults if no slotted content is provided.
   */
  async connectedCallback() {
    const [style, html] = await Promise.all([
      fetch(styleURL).then(res => res.text()),
      fetch(templateURL).then(res => res.text())
    ]);

    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      ${html}
    `;

    this.setSlotText(
      "title",
      this.getAttribute("title") || "Civic Interconnect Dashboard"
    );

    this.setSlotText(
      "subtitle",
      this.getAttribute("subtitle") || "Agent Status and Mapping Overview"
    );
  }

  /**
   * Replaces the fallback content of a slot with
   * a new text node if no content is slotted.
   *
   * @param {string} slotName - The slot name.
   * @param {string} fallbackText - The fallback text.
   */
  setSlotText(slotName, fallbackText) {
    const slot = this.shadowRoot.querySelector(`slot[name="${slotName}"]`);
    if (slot && slot.assignedNodes().length === 0) {
      slot.innerHTML = fallbackText;
    }
  }
}

customElements.define("ci-header", CiHeader);
