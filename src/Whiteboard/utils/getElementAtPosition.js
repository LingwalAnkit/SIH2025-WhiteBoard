import { toolTypes, cursorPositions } from "../../constants";
import { emitElementUpdate } from "../../socketConn/socketConn";
import { createElement } from "./createElement";

const distance = (a, b) =>
  Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

const onLine = ({ x1, y1, x2, y2, x, y, maxDistance = 1 }) => {
  const a = { x: x1, y: y1 };
  const b = { x: x2, y: y2 };
  const c = { x, y };

  const offset = distance(a, b) - (distance(a, c) + distance(b, c));
  return Math.abs(offset) < maxDistance ? cursorPositions.INSIDE : null;
};

const nearPoint = (x, y, x1, y1, cursorPosition) => {
  return Math.abs(x - x1) < 5 && Math.abs(y - y1) < 5 ? cursorPosition : null;
};

// Helper function to check if point is inside triangle using barycentric coordinates
const pointInTriangle = (px, py, ax, ay, bx, by, cx, cy) => {
  const v0 = { x: cx - ax, y: cy - ay };
  const v1 = { x: bx - ax, y: by - ay };
  const v2 = { x: px - ax, y: py - ay };

  const dot00 = v0.x * v0.x + v0.y * v0.y;
  const dot01 = v0.x * v1.x + v0.y * v1.y;
  const dot02 = v0.x * v2.x + v0.y * v2.y;
  const dot11 = v1.x * v1.x + v1.y * v1.y;
  const dot12 = v1.x * v2.x + v1.y * v2.y;

  const denom = dot00 * dot11 - dot01 * dot01;
  if (denom === 0) return false;

  const invDenom = 1 / denom;
  const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
  const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

  return u >= 0 && v >= 0 && u + v < 1;
};

export const getCursorForPosition = (position) => {
  switch (position) {
    case cursorPositions.TOP_LEFT:
    case cursorPositions.BOTTOM_RIGHT:
    case cursorPositions.START:
    case cursorPositions.END:
      return "nwse-resize";
    case cursorPositions.TOP_RIGHT:
    case cursorPositions.BOTTOM_LEFT:
      return "nesw-resize";
    case cursorPositions.INSIDE:
      return "move";
    default:
      return "default";
  }
};

// Function to get resized coordinates
export const getResizedCoordinates = (
  clientX,
  clientY,
  position,
  coordinates
) => {
  const { x1, y1, x2, y2 } = coordinates;

  switch (position) {
    case cursorPositions.TOP_LEFT:
    case cursorPositions.START:
      return { x1: clientX, y1: clientY, x2, y2 };
    case cursorPositions.TOP_RIGHT:
      return { x1, y1: clientY, x2: clientX, y2 };
    case cursorPositions.BOTTOM_LEFT:
      return { x1: clientX, y1, x2, y2: clientY };
    case cursorPositions.BOTTOM_RIGHT:
    case cursorPositions.END:
      return { x1, y1, x2: clientX, y2: clientY };
    default:
      return { x1, y1, x2, y2 };
  }
};

// Enhanced position detection for better resize handles
const positionWithinElement = (x, y, element) => {
  const { type, x1, x2, y1, y2 } = element;

  switch (type) {
    case toolTypes.IMAGE:
    case toolTypes.RECTANGLE: {
      const topLeft = nearPoint(x, y, x1, y1, cursorPositions.TOP_LEFT);
      const topRight = nearPoint(x, y, x2, y1, cursorPositions.TOP_RIGHT);
      const bottomLeft = nearPoint(x, y, x1, y2, cursorPositions.BOTTOM_LEFT);
      const bottomRight = nearPoint(x, y, x2, y2, cursorPositions.BOTTOM_RIGHT);
      const inside =
        x >= x1 && x <= x2 && y >= y1 && y <= y2
          ? cursorPositions.INSIDE
          : null;
      return topLeft || topRight || bottomLeft || bottomRight || inside;
    }

    case toolTypes.CIRCLE: {
      const width = Math.abs(x2 - x1);
      const height = Math.abs(y2 - y1);
      const centerX = Math.min(x1, x2) + width / 2;
      const centerY = Math.min(y1, y2) + height / 2;
      const radius = Math.max(width, height) / 2;

      // Check resize handles at circle edges
      const topLeft = nearPoint(x, y, x1, y1, cursorPositions.TOP_LEFT);
      const topRight = nearPoint(x, y, x2, y1, cursorPositions.TOP_RIGHT);
      const bottomLeft = nearPoint(x, y, x1, y2, cursorPositions.BOTTOM_LEFT);
      const bottomRight = nearPoint(x, y, x2, y2, cursorPositions.BOTTOM_RIGHT);

      const distanceFromCenter = Math.sqrt(
        Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
      );
      const inside =
        distanceFromCenter <= radius ? cursorPositions.INSIDE : null;

      return topLeft || topRight || bottomLeft || bottomRight || inside;
    }

    case toolTypes.TRIANGLE: {
      const width = Math.abs(x2 - x1);
      const height = Math.abs(y2 - y1);

      if (width < 2 && height < 2) {
        const distanceFromClick = Math.sqrt(
          Math.pow(x - x1, 2) + Math.pow(y - y1, 2)
        );
        return distanceFromClick <= 5 ? cursorPositions.INSIDE : null;
      }

      // Triangle resize handles
      const topLeft = nearPoint(x, y, x1, y1, cursorPositions.TOP_LEFT);
      const topRight = nearPoint(x, y, x2, y1, cursorPositions.TOP_RIGHT);
      const bottomLeft = nearPoint(x, y, x1, y2, cursorPositions.BOTTOM_LEFT);
      const bottomRight = nearPoint(x, y, x2, y2, cursorPositions.BOTTOM_RIGHT);

      const minX = Math.min(x1, x2);
      const maxX = Math.max(x1, x2);
      const minY = Math.min(y1, y2);
      const maxY = Math.max(y1, y2);
      const x3 = minX + width / 2;
      const y3 = minY;

      const ax = minX,
        ay = maxY;
      const bx = maxX,
        by = maxY;
      const cx = x3,
        cy = y3;

      const inside = pointInTriangle(x, y, ax, ay, bx, by, cx, cy)
        ? cursorPositions.INSIDE
        : null;
      return topLeft || topRight || bottomLeft || bottomRight || inside;
    }

    case toolTypes.TEXT:
      return x >= x1 && x <= x2 && y >= y1 && y <= y2
        ? cursorPositions.INSIDE
        : null;

    case toolTypes.LINE: {
      const on = onLine({ x1, y1, x2, y2, x, y });
      const start = nearPoint(x, y, x1, y1, cursorPositions.START);
      const end = nearPoint(x, y, x2, y2, cursorPositions.END);
      return start || end || on;
    }

    case toolTypes.PENCIL: {
      const betweenAnyPoint = element.points.some((point, index) => {
        const nextPoint = element.points[index + 1];
        if (!nextPoint) return false;
        return onLine({
          x1: point.x,
          y1: point.y,
          x2: nextPoint.x,
          y2: nextPoint.y,
          x,
          y,
          maxDistance: 5,
        });
      });
      return betweenAnyPoint ? cursorPositions.INSIDE : null;
    }

    default:
      return null;
  }
};

// Function to update element
export const updateElement = (elementData, elements, roomID) => {
  const { index, ...updatedElement } = elementData;
  console.log("\n\n\nUPDATE ELEMENT CLASSED ");

  // Create new element with updated properties
  const newElement = createElement({
    x1: updatedElement.x1,
    y1: updatedElement.y1,
    x2: updatedElement.x2,
    y2: updatedElement.y2,
    toolType: updatedElement.type,
    id: updatedElement.id,
    text: updatedElement.text,
    src: updatedElement.src,
    color: updatedElement.color,
    roomID,
  });

  // Emit the update
  emitElementUpdate(newElement, roomID);
};

// Function to update pencil element when moving
export const updatePencilElementWhenMoving = (
  { index, newPoints, color },
  elements
) => {
  const updatedElement = {
    ...elements[index],
    points: newPoints,
    color: color || elements[index].color,
  };

  emitElementUpdate(updatedElement);
};

// Your existing functions...
export const getElementAtPosition = (x, y, elements) => {
  return elements
    .map((el) => ({
      ...el,
      position: positionWithinElement(x, y, el),
    }))
    .find((el) => el.position !== null && el.position !== undefined);
};
