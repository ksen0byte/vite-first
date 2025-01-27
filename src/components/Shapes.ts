type ShapeColor = "red" | "green" | "blue";
type ShapeType = "circle" | "triangle" | "square";

/** Return random shape as an SVG string. */
export function getRandomShape(size: number, color?: ShapeColor, shape?: ShapeType): string {
  const colors: ShapeColor[] = ["red", "blue", "green"];
  const shapes: ShapeType[] = ["circle", "triangle", "square"];
  const chosenColor = color ?? colors[Math.floor(Math.random() * colors.length)];
  const chosenShape = shape ?? shapes[Math.floor(Math.random() * shapes.length)];
  return getShapeSvg(size, chosenColor, chosenShape);
}

/** Return an SVG string for a given shape, color, and size. */
function getShapeSvg(size: number, color: ShapeColor, shape: ShapeType): string {
  switch (shape) {
    case "circle":
      return `<svg width="${size}mm" height="${size}mm" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="none" stroke="${color}" stroke-width="4"/></svg>`;
    case "square":
      return `<svg width="${size}mm" height="${size}mm" viewBox="0 0 100 100"><rect x="4" y="4" width="92" height="92" fill="none" stroke="${color}" stroke-width="4"/></svg>`;
    case "triangle":
      return `<svg width="${size}mm" height="${size}mm" viewBox="0 0 100 100"><polygon points="50,4 96,96 4,96" fill="none" stroke="${color}" stroke-width="4"/></svg>`;
    default:
      throw new Error(`Unsupported shape: ${shape}`);
  }
}
