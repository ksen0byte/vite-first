export class RadioGroup {
  private readonly container: HTMLDivElement;
  private options: { value: string; label: string }[];
  private selectedValue: string;

  constructor(options: { value: string; label: string }[], defaultValue: string) {
    this.options = options;
    this.selectedValue = defaultValue;

    // Create the container for the radio group
    this.container = document.createElement("div");
    this.container.className = "form-control";

    // Render the radio buttons
    this.render();
  }

  // Render the radio buttons
  private render(): void {
    this.container.innerHTML = this.options
      .map(
        (option) => `
        <label class="label cursor-pointer">
          <input
            type="radio"
            name="radioGroup"
            value="${option.value}"
            ${option.value === this.selectedValue ? "checked" : ""}
            class="radio radio-primary"
          >
          <span class="label-text ml-2">${option.label}</span>
        </label>
      `
      )
      .join("");

    // Attach event listeners for each radio button
    this.container.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        this.selectedValue = radio.value;
        this.onSelectionChange();
      });
    });
  }

  // Handle selection change (can be overridden)
  protected onSelectionChange(): void {
    // No-op: Override in subclasses or attach listeners
  }

  // Attach the radio group to a parent element
  mount(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  // Get the currently selected value
  getValue(): string {
    return this.selectedValue;
  }

  // Set the selected value programmatically
  setValue(value: string): void {
    this.selectedValue = value;
    this.render(); // Re-render the radio group to reflect the updated value
  }

  // Add a listener for selection changes
  addSelectionChangeListener(listener: (value: string) => void): void {
    this.onSelectionChange = () => listener(this.selectedValue);
  }
}
