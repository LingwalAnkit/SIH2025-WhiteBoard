"use client";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toolTypes } from "../constants";
import ImageIcon from "../resources/icons/ImageIcon.svg";
import lineIcon from "../resources/icons/line.svg";
import pencilIcon from "../resources/icons/pencil.svg";
import rectangleIcon from "../resources/icons/rectangle.svg";
import rubberIcon from "../resources/icons/rubber.svg";
import selectionIcon from "../resources/icons/selection.svg";
import textIcon from "../resources/icons/text.svg";
import { emitClearWhiteboard } from "../socketConn/socketConn";
import { setElements, setToolType } from "./whiteboardSlice";
import ColorPicker from "./utils/ColorPicker";
import Circle from "../resources/icons/circle.svg";
import triangle from "../resources/icons/triangle.png";
import Bin from "../resources/icons/icons8-bin-50.png";

const IconButton = ({ src, type, isRubber, isClearAll, roomID }) => {
  const dispatch = useDispatch();

  const selectedToolType = useSelector((state) => state.whiteboard.tool);

  const handleToolChange = () => {
    dispatch(setToolType(type));
  };

  const handleClearCanvas = () => {
    dispatch(setElements([]));
    emitClearWhiteboard(roomID);
  };

  // Determine which action to take
  const handleClick = () => {
    if (isClearAll) {
      handleClearCanvas();
    } else {
      handleToolChange();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={
        selectedToolType === type ? "menu_button_active" : "menu_button"
      }
    >
      <img alt="Tool Icon" width="70%" height="70%" src={src} />
    </button>
  );
};

const Menu = ({ roomID }) => {
  const dispatch = useDispatch(); // Move useDispatch to the top level of the component
  // eslint-disable-next-line no-unused-vars
  const [AISearchOpen, setAISearchOpen] = useState(false);

  const handleClearAll = () => {
    dispatch(setElements([]));
    emitClearWhiteboard(roomID);
  };

  return (
    <div className="menu_container">
      <div
        style={{
          position: "absolute",
          top: "0",
          left: "600px",
        }}
      >
        <ColorPicker />
      </div>

      <IconButton src={rectangleIcon} type={toolTypes.RECTANGLE} />
      <IconButton src={lineIcon} type={toolTypes.LINE} />

      {/* Eraser tool - for selecting and removing individual elements */}
      <IconButton src={rubberIcon} type={toolTypes.ERASER} />

      <IconButton src={pencilIcon} type={toolTypes.PENCIL} />
      <IconButton src={textIcon} type={toolTypes.TEXT} />
      <IconButton src={triangle} type={toolTypes.TRIANGLE} />
      <IconButton src={selectionIcon} type={toolTypes.SELECTION} />
      <IconButton src={ImageIcon} type={toolTypes.IMAGE} />
      <IconButton src={Circle} type={toolTypes.CIRCLE} />

      {/* Clear All button - separate button for clearing entire whiteboard */}
      <button
        onClick={handleClearAll}
        className="menu_button clear_all_button"
        title="Clear All Elements"
      >
        <img
          src={Bin}
          alt="Clear All"
          className="w-2 h-2"
          height={25}
          width={25}
        />
      </button>
    </div>
  );
};

export default Menu;
