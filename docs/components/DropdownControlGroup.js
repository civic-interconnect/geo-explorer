// components/DropdownControlGroup.js

/**
 * Populates an existing <select> and its label inside a .control-group div.
 *
 * @param {Object} config
 * @param {string} config.selectId - The ID of the existing <select> element
 * @param {string} config.labelText - The text to set for the <label>
 * @param {Array} config.options - Array of { value, label }
 * @param {string|null} config.value - Currently selected value
 * @param {function} config.onChange - Called when user changes selection
 * @param {boolean} [config.showDefaultOption] - Whether to add a default option
 * @param {string} [config.defaultLabel] - Text for the default option
 */
export function DropdownControlGroup({
  selectId,
  labelText,
  options = [],
  value = null,
  onChange,
  showDefaultOption = true,
  defaultLabel = "[ Select an Option ]"
}) {
  const select = document.getElementById(selectId);
  const label = document.querySelector(`label[for="${selectId}"]`);
  const controlGroup = select?.closest(".control-group");

  if (!select || !label || !controlGroup) {
    console.error(
      `[DropdownControlGroup] ERROR: Could not find all elements for selectId='${selectId}'.`
    );
    return;
  }

  console.log(`[DropdownControlGroup] Populating #${selectId}`, {
    labelText,
    options,
    value
  });

  // Update the label text
  label.textContent = labelText;

  // Clear previous options
  select.innerHTML = "";

  if (showDefaultOption) {
    const opt = document.createElement("option");
    opt.disabled = true;
    opt.selected = value == null;
    opt.textContent = defaultLabel;
    select.appendChild(opt);
  }

  options.forEach(opt => {
    const optionEl = document.createElement("option");
    optionEl.value = opt.value;
    optionEl.textContent = opt.label;
    if (opt.value === value) {
      optionEl.selected = true;
    }
    select.appendChild(optionEl);
  });

  select.onchange = (e) => {
    if (onChange) onChange(e.target.value);
  };
}
