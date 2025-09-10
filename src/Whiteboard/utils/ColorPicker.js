import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedColor } from "../whiteboardSlice";

const ColorPicker = () => {
  const dispatch = useDispatch();
  const selectedColor = useSelector((state) => state.whiteboard.selectedColor || "#000000");

  const colors = [
    "#000000", // Black
    "#FF0000", // Red
    "#00FF00", // Green
    "#0000FF", // Blue
    "#FFFF00", // Yellow
    "#FF00FF", // Magenta
    "#00FFFF", // Cyan
    "#FFA500", // Orange
    "#800080", // Purple
  ];

  const handleColorChange = (color) => {
    dispatch(setSelectedColor(color));
  };

  return (
    <div className="color_picker_container">
      <div className="color_display" style={{ backgroundColor: selectedColor }}></div>
      <div className="color_options">
        {colors.map((color) => (
          <button
            key={color}
            className={`color_button ${selectedColor === color ? "selected" : ""}`}
            style={{ backgroundColor: color }}
            onClick={() => handleColorChange(color)}
          />
        ))}
      </div>
    </div>
  );
};

export default ColorPicker;