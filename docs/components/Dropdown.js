// components/Dropdown.js

export function Dropdown({ label, options = [], value, onChange }) {
  const container = document.createElement("div");
  container.classList.add("dropdown-group");

  const labelEl = document.createElement("label");
  labelEl.textContent = label;
  container.appendChild(labelEl);

  const select = document.createElement("select");

  options.forEach(opt => {
    const option = document.createElement("option");
    option.value = opt.value;
    option.textContent = opt.label;
    if (opt.value === value) option.selected = true;
    select.appendChild(option);
  });

  select.addEventListener("change", () => {
    if (onChange) onChange(select.value);
  });

  container.appendChild(select);
  return container;
}
