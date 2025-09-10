import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedColor } from "../whiteboardSlice";

const ColorPicker = () => {
  const dispatch = useDispatch();
  const selectedColor = useSelector(
    (state) => state.whiteboard.selectedColor || "#000000"
  );
  const [isOpen, setIsOpen] = useState(false);

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
    "#FFFFFF", // White
    "#808080", // Gray
    "#964B00", // Brown
  ];

  const handleColorChange = (color) => {
    dispatch(setSelectedColor(color));
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Styles
  const containerStyle = {
    position: "relative",
    display: "flex",
    alignItems: "center",
  };

  const triggerButtonStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "48px",
    height: "48px",
    border: "2px solid #ddd",
    borderRadius: "8px",
    backgroundColor: selectedColor,
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    position: "relative",
  };

  const dropdownStyle = {
    position: "absolute",
    top: "52px",
    left: "0",
    zIndex: 1001,
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
    padding: "8px",
    display: isOpen ? "block" : "none",
  };

  const colorGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "4px",
    width: "120px",
  };

  const colorButtonStyle = (color, isSelected) => ({
    width: "32px",
    height: "32px",
    border: isSelected ? "3px solid #3b82f6" : "1px solid #ddd",
    borderRadius: "6px",
    backgroundColor: color,
    cursor: "pointer",
    transition: "all 0.2s ease",
    transform: isSelected ? "scale(1.05)" : "scale(1)",
    boxShadow: isSelected
      ? "0 2px 8px rgba(59, 130, 246, 0.3)"
      : "0 1px 3px rgba(0, 0, 0, 0.1)",
  });

  const arrowStyle = {
    position: "absolute",
    bottom: "2px",
    right: "2px",
    width: "0",
    height: "0",
    borderLeft: "4px solid transparent",
    borderRight: "4px solid transparent",
    borderTop: "4px solid #666",
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest(".color-picker-container")) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div style={containerStyle} className="color-picker-container">
      {/* Color display trigger button */}
      <button
        onClick={toggleDropdown}
        style={triggerButtonStyle}
        title="Select Color"
      >
        {/* Small arrow indicator */}
        <div style={arrowStyle}></div>
      </button>

      {/* Dropdown menu */}
      <div style={dropdownStyle}>
        <div style={colorGridStyle}>
          {colors.map((color) => (
            <button
              key={color}
              style={colorButtonStyle(color, selectedColor === color)}
              onClick={() => handleColorChange(color)}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;
