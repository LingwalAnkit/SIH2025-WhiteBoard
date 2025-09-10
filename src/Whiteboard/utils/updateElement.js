import { createElement } from ".";
import { toolTypes } from "../../constants";
import { emitElementUpdate } from "../../socketConn/socketConn";
import { store } from "../../store/store";
import { setElements } from "../whiteboardSlice";

export const updatePencilElementWhenMoving = (
  { index, newPoints, color }, // Add color parameter
  elements,
  roomID // ✅ Add roomID parameter
) => {
  const elementsCopy = [...elements];

  elementsCopy[index] = {
    ...elementsCopy[index],
    points: newPoints,
    color: color || elementsCopy[index].color,
  };

  console.log("updating pencil element with color:", color);

  const updatedPencilElement = elementsCopy[index];

  store.dispatch(setElements(elementsCopy));
  emitElementUpdate(updatedPencilElement, roomID); // ✅ Pass roomID
};

export const updateElement = (
  { id, x1, x2, y1, y2, type, index, text, src, color, fill, fillStyle },
  elements,
  roomID
) => {
  console.log(`\n\n${src}\n\n`);
  const elementsCopy = [...elements];

  switch (type) {
    case toolTypes.LINE:
    case toolTypes.RECTANGLE:
    case toolTypes.CIRCLE:
    case toolTypes.TRIANGLE:
      const updatedElement = createElement({
        id,
        x1,
        y1,
        x2,
        y2,
        toolType: type,
        color, // Include color when updating
        fill,
        fillColorStyle: fillStyle,
      });

      elementsCopy[index] = updatedElement;

      store.dispatch(setElements(elementsCopy));

      emitElementUpdate(updatedElement, roomID);
      break;
    case toolTypes.PENCIL:
      elementsCopy[index] = {
        ...elementsCopy[index],
        points: [
          ...elementsCopy[index].points,
          {
            x: x2,
            y: y2,
          },
        ],
        color, // Include color when updating
      };

      const updatedPencilElement = elementsCopy[index];

      store.dispatch(setElements(elementsCopy));

      emitElementUpdate(updatedPencilElement, roomID);
      break;
    case toolTypes.TEXT:
      elementsCopy[index] = {
        ...createElement({
          id,
          x1,
          y1,
          x2,
          y2,
          toolType: type,
          text,
          color, // Include color when updating
        }),
      };

      const updatedTextElement = elementsCopy[index];

      store.dispatch(setElements(elementsCopy));

      emitElementUpdate(updatedTextElement, roomID);
      break;
    case toolTypes.IMAGE: {
      elementsCopy[index] = {
        ...createElement({
          id,
          x1,
          y1,
          x2,
          y2,
          toolType: type,
          src: src,
          color, // Add color parameter
        }),
      };

      const updatedImageElement = elementsCopy[index];
      store.dispatch(setElements(elementsCopy));
      console.log("\n\nUPDATE ELEMET IMAGE CLSSED ");
      emitElementUpdate(updatedImageElement, roomID); // This was missing roomID!
      break;
    }

    default:
      throw new Error("Something went wrong when updating element");
  }
};
