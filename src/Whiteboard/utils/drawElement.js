import { getStroke } from "perfect-freehand";
import { getSvgPathFromStroke } from ".";
import { toolTypes } from "../../constants";

// Image cache to prevent reloading
const imageCache = new Map();

const drawPencilElement = (context, element) => {
  // Save the current context state
  context.save();

  // Make sure we have a valid color
  const elementColor = element.color || "#000000";

  // Set the stroke and fill styles
  context.strokeStyle = elementColor;
  context.fillStyle = elementColor;

  const myStroke = getStroke(element.points, {
    size: 3,
    thinning: 0.5,
    smoothing: 0.5,
    streamline: 0.5,
  });

  const pathData = getSvgPathFromStroke(myStroke);

  const myPath = new Path2D(pathData);
  context.fill(myPath);

  // Restore the context state
  context.restore();
};

const drawTextElement = (context, element, wordsPerLine = 15) => {
  // Save the current context state
  context.save();

  // Make sure we have a valid color
  const textColor = element.color || "#000000";

  // Set text rendering properties
  context.textBaseline = "top";
  context.font = "15px sans-serif";
  context.fillStyle = textColor;

  // Split text into words and lines
  const words = element.text ? element.text.split(" ") : [];
  const lines = [];

  // Create lines with a maximum of 'wordsPerLine' words per line
  for (let i = 0; i < words.length; i += wordsPerLine) {
    let line = words.slice(i, i + wordsPerLine).join(" ");
    lines.push(line);
  }

  // Render each line
  const lineHeight = 16;
  lines.forEach((line, index) => {
    context.fillText(line, element.x1, element.y1 + index * lineHeight);
  });

  // Restore the context state
  context.restore();
};

const drawImageElement = (context, element) => {
  // Return early if no src
  if (!element.src) {
    drawImagePlaceholder(context, element);
    return;
  }

  // Use element dimensions or calculate from coordinates
  const width = element.width || Math.abs(element.x2 - element.x1) || 200;
  const height = element.height || Math.abs(element.y2 - element.y1) || 200;

  // Check if image is already cached
  if (imageCache.has(element.src)) {
    const cachedImg = imageCache.get(element.src);
    if (cachedImg.complete && cachedImg.naturalWidth > 0) {
      // Image is loaded and ready
      context.drawImage(cachedImg, element.x1, element.y1, width, height);
    } else if (cachedImg.error) {
      // Image failed to load
      drawImagePlaceholder(context, element, "Failed to load image");
    } else {
      // Still loading
      drawImagePlaceholder(context, element, "Loading...");
    }
    return;
  }

  // Create new image and add to cache
  const img = new Image();
  img.crossOrigin = "anonymous"; // Handle CORS issues

  // Store in cache immediately to prevent duplicate requests
  imageCache.set(element.src, img);

  img.onload = () => {
    // Mark as loaded and trigger re-render
    img.loaded = true;
    console.log(`Image loaded successfully for element ${element.id}`);

    // Force canvas re-render by dispatching a custom event
    window.dispatchEvent(
      new CustomEvent("imageLoaded", {
        detail: { elementId: element.id },
      })
    );
  };

  img.onerror = () => {
    // Mark as error
    img.error = true;
    console.error(
      `Failed to load image for element ${element.id}:`,
      element.src
    );

    // Force canvas re-render
    window.dispatchEvent(
      new CustomEvent("imageError", {
        detail: { elementId: element.id },
      })
    );
  };

  // Start loading
  img.src = element.src;

  // Show loading placeholder
  drawImagePlaceholder(context, element, "Loading...");
};

const drawImagePlaceholder = (context, element, message = "Image") => {
  const width = Math.abs(element.x2 - element.x1) || 200;
  const height = Math.abs(element.y2 - element.y1) || 200;

  // Save context
  context.save();

  // Draw border
  context.strokeStyle = element.color || "#666";
  context.lineWidth = 2;
  context.setLineDash([5, 5]);
  context.strokeRect(element.x1, element.y1, width, height);

  // Fill background
  context.fillStyle = "#f8f9fa";
  context.fillRect(element.x1, element.y1, width, height);

  // Draw text
  context.fillStyle = "#666";
  context.font = "14px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(message, element.x1 + width / 2, element.y1 + height / 2);

  // Restore context
  context.restore();
};

export const drawElement = ({ roughCanvas, context, element }) => {
  // Add safety check for element
  if (!element || !element.type) {
    console.warn("Invalid element received:", element);
    return;
  }

  switch (element.type) {
    case toolTypes.RECTANGLE:
    case "rectangle": // Add string fallback
    case toolTypes.LINE:
    case "line":
    case toolTypes.CIRCLE:
    case "circle":
    case toolTypes.TRIANGLE:
    case "triangle":
      // Check if roughElement exists
      if (element.roughElement) {
        return roughCanvas.draw(element.roughElement);
      } else {
        console.warn("Missing roughElement for shape:", element);
        return;
      }

    case toolTypes.PENCIL:
    case "pencil":
      drawPencilElement(context, element);
      break;

    case toolTypes.TEXT:
    case "text":
      drawTextElement(context, element);
      break;

    case toolTypes.IMAGE:
    case "image": // ✅ Add this line to handle lowercase "image"
      drawImageElement(context, element);
      break;

    default:
      console.warn("Unknown element type:", element.type);
      // Don't throw error, just log and return
      return;
  }
};

// Export function to clear image cache when needed
export const clearImageCache = () => {
  imageCache.clear();
};
