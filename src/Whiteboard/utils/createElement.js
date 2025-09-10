import rough from "roughjs/bundled/rough.esm";
import { toolTypes } from "../../constants";
import { emitElementUpdate } from "../../socketConn/socketConn";
import { useSelector } from "react-redux";

const generator = rough.generator();

const generateRectangle = ({ x1, y1, x2, y2, color, filling, fillStyle }) => {
  console.log("generateRectangle called with color:", color);
  console.log(`\n\nfillinf style  here \n\n${fillStyle}\n\n`);
  const toFillColor = filling ? color : false;
  return generator.rectangle(x1, y1, x2 - x1, y2 - y1, {
    fill: toFillColor,
    stroke: color || "red",
    hachureAngle: 60,
    hachureGap: 8,
    // fillStyle: "",
    fillStyle: fillStyle,
  });
};

const generateLine = ({ x1, y1, x2, y2, color }) => {
  const strokeColor = color || "#000000";

  return generator.line(x1, y1, x2, y2, {
    stroke: strokeColor,
    strokeWidth: 2,
    roughness: 1,
  });
};

const generateCircle = ({ x1, y1, x2, y2, color, filling, fillStylee }) => {
  const toFillColor = filling ? color : false;
  const width = Math.abs(x2 - x1);
  const height = Math.abs(y2 - y1);
  const centerX = Math.min(x1, x2) + width / 2;
  const centerY = Math.min(y1, y2) + height / 2;
  const radius = Math.max(width, height) / 2;

  return generator.circle(centerX, centerY, radius * 2, {
    fill: toFillColor,
    stroke: color || "blue",
    hachureAngle: 60,
    hachureGap: 8,
    fillStyle: fillStylee,
  });
};

const generateTriangle = ({ x1, y1, x2, y2, color, filling, fillStylee }) => {
  const toFillColor = filling ? color : false;
  // Ensure the coordinates are valid numbers AND not identical
  if (
    isNaN(x1) ||
    isNaN(y1) ||
    isNaN(x2) ||
    isNaN(y2) ||
    (x1 === x2 && y1 === y2)
  ) {
    console.error("Invalid coordinates for triangle:", { x1, y1, x2, y2 });

    // Return a minimal triangle that won't cause issues
    return generator.polygon(
      [
        [x1, y1],
        [x1 + 1, y1],
        [x1, y1 + 1],
      ],
      {
        fill: toFillColor,
        stroke: color || "#FFD700",
        // fillStyle: "hachure",
        hachureAngle: 60,
        hachureGap: 8,
        roughness: 1,
        fillStyle: fillStylee,
      }
    );
  }

  const width = Math.abs(x2 - x1);
  const height = Math.abs(y2 - y1);

  if (width < 2 && height < 2) {
    return generator.polygon(
      [
        [x1, y1],
        [x1 + 2, y1],
        [x1 + 1, y1 + 2],
      ],
      {
        fill: toFillColor,
        stroke: color || "#FFD700",
        // fillStyle: "hachure",
        hachureAngle: 60,
        hachureGap: 8,
        roughness: 1,
        fillStyle: fillStylee,
      }
    );
  }

  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);

  const x3 = minX + width / 2;
  const y3 = minY;

  return generator.polygon(
    [
      [minX, maxY],
      [maxX, maxY],
      [x3, y3],
    ],
    {
      fill: toFillColor,
      stroke: color || "#FFD700",
      // fillStyle: "hachure",
      hachureAngle: 60,
      hachureGap: 8,
      roughness: 1,
      fillStyle: fillStylee,
    }
  );
};

// Updated createElement function with proper image handling
export const createElement = ({
  x1,
  y1,
  x2,
  y2,
  toolType,
  fillColorStyle,
  id,
  text,
  src,
  roomID,
  color,
  fill,
}) => {
  let roughElement;
  const elementColor = color || "#000000";
  console.log(
    `\n\nFILL STATE AT CREATE ELEMENT LINE 136 ${fillColorStyle} \n\n`
  );

  switch (toolType) {
    case toolTypes.RECTANGLE:
      roughElement = generateRectangle({
        x1,
        y1,
        x2,
        y2,
        color,
        filling: fill,
        fillStyle: fillColorStyle,
      });
      return {
        id: id,
        roughElement,
        type: toolType,
        x1,
        y1,
        x2,
        y2,
        color: elementColor,
      };

    case toolTypes.LINE:
      roughElement = generateLine({ x1, x2, y1, y2, color });
      return {
        id: id,
        roughElement,
        type: toolType,
        x1,
        y1,
        x2,
        y2,
        color: elementColor,
      };

    case toolTypes.TRIANGLE:
      roughElement = generateTriangle({
        x1,
        y1,
        x2,
        y2,
        color,
        fill,
        filling: fill,
        fillStylee: fillColorStyle,
      });
      return {
        id: id,
        roughElement,
        type: toolType,
        x1,
        y1,
        x2,
        y2,
        color: elementColor, // Fixed: was using color directly
      };

    case toolTypes.CIRCLE:
      roughElement = generateCircle({
        x1,
        y1,
        x2,
        y2,
        color,
        fill,
        filling: fill,
        fillStylee: fillColorStyle,
      });
      return {
        id: id,
        roughElement,
        type: toolType,
        x1,
        y1,
        x2,
        y2,
        color: elementColor,
      };

    case toolTypes.PENCIL:
      return {
        id,
        type: toolType,
        points: [{ x: x1, y: y1 }],
        color: elementColor,
      };

    case toolTypes.IMAGE:
      // Create the element object with all necessary properties
      const element = {
        id,
        type: toolType,
        src: src || "",
        x1,
        y1,
        x2,
        y2,
        color: elementColor,
        width: Math.abs(x2 - x1) || 200,
        height: Math.abs(y2 - y1) || 200,
      };

      console.log("Created image element:", element);
      return element;

    case toolTypes.TEXT:
      return {
        id,
        type: toolType,
        x1,
        y1,
        x2,
        y2,
        text: text || "",
        color: elementColor,
      };

    default:
      throw new Error("Something went wrong when creating element");
  }
};
