"use client";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toolTypes } from "../constants";
import { motion, AnimatePresence } from "framer-motion";
import ImageIcon from "../resources/icons/ImageIcon.svg";
import lineIcon from "../resources/icons/line.svg";
import pencilIcon from "../resources/icons/pencil.svg";
import rectangleIcon from "../resources/icons/rectangle.svg";
import rubberIcon from "../resources/icons/rubber.svg";
import fillBucket from "../resources/icons/fillBucket.svg";
import selectionIcon from "../resources/icons/selection.svg";
import textIcon from "../resources/icons/text.svg";
import { emitClearWhiteboard } from "../socketConn/socketConn";
import { setElements, setToolType } from "./whiteboardSlice";
import ColorPicker from "./utils/ColorPicker";
import Circle from "../resources/icons/circle.svg";
import triangle from "../resources/icons/triangle.png";
import Bin from "../resources/icons/icons8-bin-50.png";
import { setFillMode, setFillStyle } from "../store/fillShape";

const OPTIONS = [
  { value: "hachure", label: "Hachure" },
  { value: "solid", label: "Solid" },
  { value: "zigzag", label: "Zigzag" },
  { value: "cross-hatch", label: "Cross-hatch" },
  { value: "dots", label: "Dots" },
  { value: "sunburst", label: "Sunburst" },
  { value: "dashed", label: "Dashed" },
  { value: "zigzag-line", label: "Zigzag Line" },
];

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

  const handleClick = () => {
    if (isClearAll) {
      handleClearCanvas();
    } else {
      handleToolChange();
    }
  };

  const buttonStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    backgroundColor: selectedToolType === type ? "#3b82f6" : "#ffffff",
    cursor: "pointer",
    padding: "0px",
    transition: "all 0.2s ease",
    boxShadow:
      selectedToolType === type
        ? "0 2px 8px rgba(59, 130, 246, 0.3)"
        : "0 1px 3px rgba(0, 0, 0, 0.1)",
  };

  return (
    <button onClick={handleClick} style={buttonStyle}>
      <img alt="Tool Icon" width="70%" height="70%" src={src} />
    </button>
  );
};

const Menu = ({ roomID }) => {
  const dispatch = useDispatch();
  const [AISearchOpen, setAISearchOpen] = useState(false);
  const fillShape = useSelector((state) => state.fillShape.filling);
  const [selected, setSelected] = useState("hachure");

  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let timer;
    if (expanded) {
      timer = setTimeout(() => {
        setExpanded(false);
      }, 4000); // collapse after 4 seconds
    }
    return () => clearTimeout(timer);
  }, [expanded]);

  const handleChange = (e) => {
    const value = e.target.value;
    setSelected(value);
    dispatch(setFillStyle(value));
  };

  const handleClearAll = () => {
    dispatch(setElements([]));
    emitClearWhiteboard(roomID);
  };

  const toggleFillState = () => {
    dispatch(setFillMode(!fillShape));
  };

  const toggleExpand = () => {
    setExpanded((prev) => !prev);
  };

  const menuContainerStyle = {
    position: "fixed",
    top: "0px",
    left: "50%",
    transform: "translateX(-50%)",
    padding: expanded ? "12px" : "10px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
    border: "1px solid #e5e7eb",
    zIndex: 1000,
    height: expanded ? "40px" : "30px",
  };

  const collapsedContainerStyle = {
    display: "flex",
    justifyContent: "center",
    gap: "8px",
    cursor: "pointer",
    width: "160px",
    height: "30px",
    alignItems: "center",
    fontWeight: "600",
    fontSize: "16px",
    color: "#374151",
    borderRadius: "12px",
    border: "1px solid #ddd",
    userSelect: "none",
  };

  const expandedContentStyle = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "12px",
  };

  return (
    <motion.div
      style={menuContainerStyle}
      initial={{ width: 160 }}
      animate={{ width: expanded ? 750 : 160 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {!expanded ? (
        <div
          style={collapsedContainerStyle}
          onClick={toggleExpand}
          title="Expand Tools"
        >
          Text Toolbar
        </div>
      ) : (
        <div style={expandedContentStyle}>
          {/* Color Picker */}
          <ColorPicker />

          {/* Tool Buttons */}
          <IconButton src={rectangleIcon} type={toolTypes.RECTANGLE} />
          <IconButton src={lineIcon} type={toolTypes.LINE} />
          <IconButton src={rubberIcon} type={toolTypes.ERASER} />
          <IconButton src={pencilIcon} type={toolTypes.PENCIL} />
          <IconButton src={textIcon} type={toolTypes.TEXT} />
          <IconButton src={triangle} type={toolTypes.TRIANGLE} />
          <IconButton src={selectionIcon} type={toolTypes.SELECTION} />
          <IconButton src={ImageIcon} type={toolTypes.IMAGE} />
          <IconButton src={Circle} type={toolTypes.CIRCLE} />

          {/* Clear All Button */}
          <button
            onClick={handleClearAll}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "48px",
              height: "48px",
              border: "1px solid #ef4444",
              borderRadius: "8px",
              backgroundColor: "#ffffff",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            }}
            title="Clear All Elements"
          >
            <img src={Bin} alt="Clear All" height={25} width={25} />
          </button>

          {/* Fill Mode Toggle Button */}
          <button
            onClick={toggleFillState}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "48px",
              height: "48px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              backgroundColor: fillShape === true ? "#3b82f6" : "#ffffff",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow:
                fillShape === true
                  ? "0 2px 8px rgba(59, 130, 246, 0.3)"
                  : "0 1px 3px rgba(0, 0, 0, 0.1)",
            }}
            title="Toggle Fill Mode"
          >
            <img src={fillBucket} alt="Fill Mode" height={25} width={25} />
          </button>

          {/* Fill Style Selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <select
              id="fill-style"
              aria-label="Select fill style"
              value={selected}
              onChange={handleChange}
              style={{
                appearance: "none",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                padding: "8px 12px",
                fontSize: "14px",
                backgroundColor: "#ffffff",
                cursor: "pointer",
                outline: "none",
                minWidth: "120px",
              }}
            >
              {OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Menu;
