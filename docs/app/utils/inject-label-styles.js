// app/utils/inject-label-styles.js

/**
 * Injects label styles into the shadow DOM
 * @param {ShadowRoot} shadowRoot - The shadow root to inject styles into
 * @param {Object} options - Styling options
 * @param {string} options.fontStyle - Font style (default: "italic")
 * @param {number} options.fontSize - Base font size in pixels (default: 14)
 * @param {number} options.precinctFontSize - Font size for precincts (default: 16)
 * @param {number} options.fontWeight - Font weight (default: 700)
 * @param {number} options.precinctFontWeight - Font weight for precincts (default: 800)
 */
export function _injectLabelStyles(shadowRoot, options = {}) {
  const {
    fontStyle = "italic",
    fontSize = 12,
    precinctFontSize = 10,
    fontWeight = 200,
    precinctFontWeight = 200,
  } = options;

  const style = document.createElement("style");
  style.textContent = `
    .feature-label {
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    .feature-label span {
      display: inline-block;
      font-size: ${fontSize}px !important;
      font-weight: ${fontWeight};
      font-style: ${fontStyle};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      text-align: center;
      white-space: nowrap;
      pointer-events: none;
      user-select: none;
      line-height: 1;
    }

    /* Extra styling for precinct labels specifically */
    .precinct-label span {
      font-size: ${precinctFontSize}px !important;
      font-weight: ${precinctFontWeight};
    }
  `;

  shadowRoot.appendChild(style);
}
