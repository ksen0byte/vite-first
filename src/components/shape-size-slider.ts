import { localize } from "./../ui";

export class ShapeSizeSlider {
  private readonly container: HTMLDivElement;
  private sizeValue: number;

  constructor(defaultValue = 50, min=20, max=70, step=10, visible: boolean = true) {
    this.sizeValue = defaultValue;

    // Create the slider's container and inner elements
    this.container = document.createElement("div");
    this.container.id = "shape-size-slider";
    this.container.style.display = visible ? "block" : "none";
    this.container.className = "w-64 mx-auto mt-4 p-4 bg-base-200 rounded-lg shadow";

    this.container.innerHTML = `
      <label for="size-range" class="block text-sm font-medium mb-2" data-localize="chooseSize">
        ${localize("chooseSize")}
      </label>
      <input type="range" id="size-range" min="${min}" max="${max}" value="${this.sizeValue}" step="${step}" class="range range-primary w-full">
      <div class="flex w-full justify-between px-2 text-xs">
        <span>|</span>
        <span>|</span>
        <span>|</span>
        <span>|</span>
        <span>|</span>
        <span>|</span>
      </div>
      <span id="size-display" class="text-sm">${this.sizeValue} mm</span>
    `;

    // Attach event listeners
    const sizeRange = this.container.querySelector<HTMLInputElement>("#size-range")!;
    const sizeDisplay = this.container.querySelector<HTMLSpanElement>("#size-display")!;
    sizeRange.addEventListener("input", () => {
      this.sizeValue = parseInt(sizeRange.value);
      sizeDisplay.textContent = `${this.sizeValue} mm`;
    });
  }

  // Mount the slider to a parent element
  mount(parent: HTMLElement) {
    parent.appendChild(this.container);
  }

  // Show the slider
  show() {
    this.container.style.display = "block";
  }

  // Hide the slider
  hide() {
    this.container.style.display = "none";
  }

  // Get the current size value
  getValue(): number {
    return this.sizeValue;
  }

  // Set the slider's value
  setValue(value: number) {
    this.sizeValue = value;
    const sizeRange = this.container.querySelector<HTMLInputElement>("#size-range")!;
    const sizeDisplay = this.container.querySelector<HTMLSpanElement>("#size-display")!;
    sizeRange.value = value.toString();
    sizeDisplay.textContent = `${value} mm`;
  }
}
