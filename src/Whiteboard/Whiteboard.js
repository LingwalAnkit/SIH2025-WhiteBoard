import { Package2Icon } from "lucide-react";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import rough from "roughjs/bundled/rough.esm";
import { v4 as uuid } from "uuid";
import ring from ".././resources/audio/ring.mp3";
import CursorOverlay from "../CursorOverlay/CursorOverlay";
import AiSearchPopup from "../components/AiSearchPopup";
import PdfViewer from "../components/PdfViewer";
import pdfImage from "../resources/icons/icons8-pdf-50.png";
import { actions, cursorPositions, toolTypes } from "../constants";
import {
  emitAudioStream,
  emitCursorPosition,
  emitElementRemoval,
  emitFile,
  emitImageElement,
  emitMessages,
  emitStudentSleeping,
  quiz,
} from "../socketConn/socketConn";
import { clearAudioStream } from "../store/audioSlice";
import { clearFile } from "../store/fileSlice";
import { store } from "../store/store";
import Menu from "./Menu";
import AI from "../resources/icons/artificialintelligence.png";
import {
  adjustElementCoordinates,
  adjustmentRequired,
  createElement,
  drawElement,
  getCursorForPosition,
  getElementAtPosition,
  getResizedCoordinates,
  updateElement,
  updatePencilElementWhenMoving,
} from "./utils";
import {
  removeElement,
  setElements,
  setMessages,
  updateElement as updateElementInStore,
} from "./whiteboardSlice";
import WebsiteShareControl from "../components/WebsiteShareControl";
import WebsiteDisplay from "../components/WebsiteDisplay";

let emitCursor = true;
let lastCursorPosition;

const Whiteboard = ({ role, userID, roomID }) => {
  const canvasRef = useRef();
  const textAreaRef = useRef();
  if (role === "teacher") {
    emitCursor = true;
  } else {
    emitCursor = false;
  }

  // eslint-disable-next-line
  const [moveCanvas, setMoveCanvas] = useState("");
  const file = useSelector((state) => state.file.file);
  // eslint-disable-next-line
  const toolType = useSelector((state) => state.whiteboard.tool);
  const [AISearchOpen, setAISearchOpen] = useState(false);
  const selectedColor = useSelector((state) => state.whiteboard.selectedColor);

  // eslint-disable-next-line
  const elements = useSelector((state) => state.whiteboard.elements);
  // eslint-disable-next-line
  const sleptStudent = useSelector((state) => state.whiteboard.slepingStudent);
  const messages = useSelector((state) => state.whiteboard.messages);
  console.log(messages);
  const quizAnswer = useSelector((state) => state.whiteboard.quizAnswer);
  const [pollResult, setPollResult] = useState(false);
  const [iscorrect, setIsCorrect] = useState(null);
  const [resultPoll, setResultPoll] = useState("");
  const [mousePosition, setMousePosition] = useState({
    x: 0,
    y: 0,
  });
  const [openImageModel, setOpenImageModel] = useState();
  const [imageUrl, setImageUrl] = useState();
  const [input, setInput] = useState("");
  const [showPdf, setShowPdf] = useState(false);

  const [action, setAction] = useState(null);
  // eslint-disable-next-line
  const [wakeupIndex, setWakeupIndex] = useState(0);
  const [openChatModal, setOpenChatModal] = useState(false);
  const [poleDialogue, setPoleDialogue] = useState(false);
  // eslint-disable-next-line
  const [pollAnswer, setPoleAnswer] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const dispatch = useDispatch();
  const audioRef = useRef(null);
  const fillShape = useSelector((state) => state.fillShape.filling);
  const fillStylee = useSelector((state) => state.fillShape.fillStyle);
  const websiteUrl = useSelector((state) => state.website.websiteUrl);

  console.log(`\n\n${fillStylee}\n\n`);

  // Select audio-related state from Redux
  // eslint-disable-next-line

  const audioStream = useSelector((state) => state.audioStreaming.audioStream);
  useEffect(() => {
    if (websiteUrl) {
      window.open(websiteUrl, "_blank");
    }
  }, [websiteUrl]);

  useEffect(() => {
    const handleSpacebar = (e) => {
      // Check if the spacebar was pressed
      if (e.code === "Space" || e.keyCode === 32) {
        doNotSendData();
      }
    };

    if (showPopup) {
      window.addEventListener("keydown", handleSpacebar);
    }

    // Cleanup listener when popup is hidden or component unmounts
    return () => {
      window.removeEventListener("keydown", handleSpacebar);
    };
    // eslint-disable-next-line
  }, [showPopup]);

  useEffect(() => {
    console.log("Elements array updated:", {
      count: elements.length,
      elementIds: elements.map((el) => ({ id: el.id, type: el.type })),
    });
  }, [elements]);

  const doNotSendData = () => {
    setWakeupIndex(0);
    if (audioRef.current) {
      resetAudio();
    }
    setShowPopup(false);
  };

  useEffect(() => {
    if (role === "student") {
      const popupInterval = setInterval(() => {
        setShowPopup(true);
        setWakeupIndex((prev) => {
          const newCount = prev + 1;
          if (newCount === 3) {
            audioRef.current = new Audio(ring);
            playAudio();
            console.log(userID);

            emitStudentSleeping(userID, roomID);
          }
          return newCount;
        });
      }, 4000 * 4 * 5);

      return () => clearInterval(popupInterval); // Cleanup interval on unmount
    }
  }, [role, roomID, userID]);

  useEffect(() => {
    console.log("=== WHITEBOARD FILE HANDLER ===");
    console.log("Current file state:", file);
    console.log("File type:", typeof file);

    if (!file) {
      console.log("No file to process");
      return;
    }

    let isPDF = true;
    let fileData = null;
    let fileName = null;

    // Handle different file formats
    if (typeof file === "string") {
      fileData = file;
      // isPDF = file.includes("application/pdf");
      console.log("String format file, isPDF:", isPDF);
    } else if (file && typeof file === "object") {
      fileData = file.file || file.url;
      fileName = file.fileName;
      isPDF =
        file.fileType === "application/pdf" ||
        (fileName && fileName.toLowerCase().endsWith(".pdf")) ||
        (fileData && fileData.includes("application/pdf"));
      console.log("Object format file, isPDF:", isPDF, "fileName:", fileName);
    }

    if (isPDF) {
      console.log("✅ PDF detected - opening viewer");
      setShowPdf(true);
      return;
    }

    if (fileData && !isPDF) {
      console.log("Non-PDF file - downloading");
      const link = document.createElement("a");
      link.href = fileData;
      link.download = fileName || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        dispatch(clearFile());
      }, 1000);
    }
  }, [file, dispatch, setShowPdf]);

  useEffect(() => {
    // Reset drawing state when tool changes
    setAction(null);
    setSelectedElement(null);
  }, [toolType]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const roughCanvas = rough.canvas(canvas);

    console.log("Rendering elements:", elements.length);

    elements.forEach((element) => {
      drawElement({ roughCanvas, context: ctx, element });
    });
  }, [elements]);

  useEffect(() => {
    const handleImageLoaded = () => {
      // Force re-render when images load
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const roughCanvas = rough.canvas(canvas);
        elements.forEach((element) => {
          drawElement({ roughCanvas, context: ctx, element });
        });
      }
    };

    const handleImageError = () => {
      // Force re-render when images fail to load
      handleImageLoaded();
    };

    window.addEventListener("imageLoaded", handleImageLoaded);
    window.addEventListener("imageError", handleImageError);

    return () => {
      window.removeEventListener("imageLoaded", handleImageLoaded);
      window.removeEventListener("imageError", handleImageError);
    };
  }, [elements]);

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  const resetAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause(); // Pause the audio
      audioRef.current.currentTime = 0; // Reset the playback position to the start
    }
  };

  // Update your handleMouseDown function
  const handleMouseDown = (event) => {
    const { clientX, clientY } = event;
    const adjustedY = clientY;

    if (selectedElement && action === actions.WRITING) {
      return;
    }

    console.log(`${fillStylee}`);

    switch (toolType) {
      case toolTypes.RECTANGLE:
      case toolTypes.LINE:
      case toolTypes.PENCIL:
      case toolTypes.CIRCLE:
      case toolTypes.TRIANGLE: {
        const element = createElement({
          x1: clientX,
          y1: adjustedY,
          x2: clientX,
          y2: adjustedY,
          toolType,
          id: uuid(),
          color: selectedColor,
          fill: fillShape,
          fillColorStyle: fillStylee,
        });

        setAction(actions.DRAWING);
        setSelectedElement(element);
        dispatch(updateElementInStore(element));
        break;
      }

      case toolTypes.TEXT: {
        const element = createElement({
          x1: clientX,
          y1: clientY,
          x2: clientX,
          y2: clientY,
          toolType,
          id: uuid(),
          color: selectedColor,
        });

        setAction(actions.WRITING);
        setSelectedElement(element);
        dispatch(updateElementInStore(element));
        break;
      }

      case toolTypes.IMAGE: {
        setOpenImageModel(true);
        setMousePosition({ x: clientX, y: clientY });
        break;
      }

      case toolTypes.ERASER: {
        const element = getElementAtPosition(clientX, clientY, elements);
        if (element) {
          // Remove locally first
          dispatch(removeElement(element.id));

          // Then emit to server
          emitElementRemoval(element.id, roomID);
        }
        break;
      }

      case toolTypes.SELECTION: {
        const element = getElementAtPosition(clientX, clientY, elements);

        if (
          element &&
          (element.type === toolTypes.RECTANGLE ||
            element.type === toolTypes.TEXT ||
            element.type === toolTypes.LINE ||
            element.type === toolTypes.IMAGE ||
            element.type === toolTypes.TRIANGLE ||
            element.type === toolTypes.CIRCLE)
        ) {
          // Determine if we're resizing or moving based on cursor position
          setAction(
            element.position === cursorPositions.INSIDE
              ? actions.MOVING
              : actions.RESIZING
          );

          // console.log(
          //   `\n\nLINE 428 IN WHITEBOAARD: \n\n ${JSON.stringify(element)}`
          // );

          const offsetX = clientX - element.x1;
          const offsetY = clientY - element.y1;

          setSelectedElement({ ...element, offsetX, offsetY });
        }

        if (element && element.type === toolTypes.PENCIL) {
          setAction(actions.MOVING);

          const xOffsets = element.points.map((point) => clientX - point.x);
          const yOffsets = element.points.map((point) => clientY - point.y);

          setSelectedElement({ ...element, xOffsets, yOffsets });
        }
        break;
      }

      default:
        return;
    }
  };

  // Update your handleMouseMove function
  const handleMouseMove = (event) => {
    const { clientX, clientY } = event;

    const selectedColor =
      store.getState().whiteboard.selectedColor || "#000000";

    lastCursorPosition = {
      cursorData: { x: clientX, y: clientY },
      roomID: roomID,
    };

    if (emitCursor) {
      emitCursorPosition({
        cursorData: { x: clientX, y: clientY },
        roomID: roomID,
      });

      setTimeout(() => {
        emitCursor = true;
        emitCursorPosition(lastCursorPosition);
      }, [80]);
    }

    // Handle drawing new elements
    if (action === actions.DRAWING && selectedElement) {
      const index = elements.findIndex((el) => el.id === selectedElement.id);

      if (index !== -1) {
        const elementColor =
          elements[index].color ||
          selectedElement.color ||
          store.getState().whiteboard.selectedColor ||
          "#000000";

        console.log(`\n\nELEMENTS ARRRRAUS ${JSON.stringify(elements)}`);

        updateElement(
          {
            index,
            id: elements[index].id,
            x1: elements[index].x1,
            y1: elements[index].y1,
            x2: clientX,
            y2: clientY,
            type: elements[index].type,
            color: elementColor,
            fill: fillShape,
            fillStyle: fillStylee,
          },
          elements,
          roomID
        );
      }
    }

    // Handle selection tool cursor changes
    if (toolType === toolTypes.SELECTION) {
      const element = getElementAtPosition(clientX, clientY, elements);
      event.target.style.cursor = element
        ? getCursorForPosition(element.position)
        : "default";
    }

    // Handle moving elements

    if (
      toolType === toolTypes.SELECTION &&
      action === actions.MOVING &&
      selectedElement
    ) {
      // Handle pencil movement
      if (selectedElement.type === toolTypes.PENCIL) {
        const newPoints = selectedElement.points.map((_, index) => ({
          x: clientX - selectedElement.xOffsets[index],
          y: clientY - selectedElement.yOffsets[index],
        }));

        const index = elements.findIndex((el) => el.id === selectedElement.id);
        if (index !== -1) {
          updatePencilElementWhenMoving(
            {
              index,
              newPoints,
              color: selectedElement.color,
            },
            elements,
            roomID // ✅ Pass roomID here
          );
        }
        return;
      }

      // Handle other element types movement
      const { id, x1, x2, y1, y2, src, type, offsetX, offsetY, text, color } =
        selectedElement;
      console.log(
        `\n\nSELECTED ELEMENT DHASV: \n\n ${JSON.stringify(
          selectedElement
        )}\n\n`
      );

      const width = x2 - x1;
      const height = y2 - y1;

      const newX1 = clientX - offsetX;
      const newY1 = clientY - offsetY;

      const index = elements.findIndex((el) => el.id === selectedElement.id);

      if (index !== -1) {
        updateElement(
          {
            id,
            x1: newX1,
            y1: newY1,
            x2: newX1 + width,
            y2: newY1 + height,
            type,
            index,
            src: src,
            text,
            color,
          },
          elements,
          roomID
        );
      }
    }

    // Handle resizing elements
    if (
      toolType === toolTypes.SELECTION &&
      action === actions.RESIZING &&
      selectedElement
    ) {
      console.log(`\n\n\ndsadsaadsada ${JSON.stringify(selectedElement)} \n\n`);
      const { id, type, position, src, color, ...coordinates } =
        selectedElement;
      // console.log(`\n\n\ndsadsaadsada ${src} \n\n`);

      const { x1, y1, x2, y2 } = getResizedCoordinates(
        clientX,
        clientY,
        position,
        coordinates
      );

      const selectedElementIndex = elements.findIndex(
        (el) => el.id === selectedElement.id
      );

      if (selectedElementIndex !== -1) {
        updateElement(
          {
            x1,
            x2,
            y1,
            y2,
            src,
            type: selectedElement.type,
            id: selectedElement.id,
            index: selectedElementIndex,
            color: selectedElement.color,
          },
          elements,
          roomID
        );
      }
    }
  };

  const handleMouseUp = () => {
    console.log(
      "Mouse up called, action:",
      action,
      "selectedElement:",
      selectedElement?.id
    );

    if (!selectedElement) {
      setAction(null);
      return;
    }

    const selectedElementIndex = elements.findIndex(
      (el) => el.id === selectedElement?.id
    );

    if (selectedElementIndex !== -1) {
      if (action === actions.DRAWING || action === actions.RESIZING) {
        console.log("Element type:", elements[selectedElementIndex].type);

        if (adjustmentRequired(elements[selectedElementIndex].type)) {
          const { x1, y1, x2, y2 } = adjustElementCoordinates(
            elements[selectedElementIndex]
          );

          const currentColor = elements[selectedElementIndex].color;

          console.log("Adjusting element coordinates:", {
            x1,
            y1,
            x2,
            y2,
            color: currentColor,
          });

          updateElement(
            {
              id: selectedElement.id,
              index: selectedElementIndex,
              x1,
              x2,
              y1,
              y2,
              type: elements[selectedElementIndex].type,
              color: currentColor,
              fill: fillShape,
              fillStyle: fillStylee,
            },
            elements,
            roomID
          );
        }
      }
    }

    // CRITICAL: Always reset these states to prevent sticky behavior
    setAction(null);
    setSelectedElement(null);
  };

  const handleTextareaBlur = (event) => {
    const { id, x1, y1, type } = selectedElement;

    const index = elements.findIndex((el) => el.id === selectedElement.id);

    if (index !== -1) {
      updateElement(
        { id, x1, y1, type, text: event.target.value, index },
        elements,
        roomID
      );

      setAction(null);
      setSelectedElement(null);
    }
  };

  const handleSendChat = () => {
    const dataToSend = { message: input, userID: userID };
    const messageCopy = [...messages, dataToSend];
    console.log(messageCopy);
    setInput("");

    store.dispatch(setMessages(messageCopy));
    emitMessages({ userID, message: input, roomID, messageCopy });
  };

  const manageQuizClick = (correctAnswer) => {
    console.log("quiz clicked");

    setPoleAnswer(correctAnswer);
    quiz({ correctAnswer, roomID });
    setPoleDialogue(false);
  };

  const handleStudentAnswer = (selectedAnswer) => {
    if (selectedAnswer === quizAnswer) {
      setResultPoll("Congrats You Have Answered Correctly");
      console.log(`is correct ${iscorrect}`);
    } else {
      setResultPoll("Oops wrong answer, better luck next time");
    }
    setPollResult(true);

    setTimeout(() => {
      setPollResult(false);
      setResultPoll("");
      setIsCorrect(null);
    }, 7000);
  };

  // In your Whiteboard.js handleFileChange function, add logging:
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log("=== FILE UPLOAD DEBUG ===");
    console.log("Selected file:", file.name, file.type, file.size);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (evt) => {
      console.log("FileReader result length:", evt.target.result.length);
      console.log(
        "FileReader result preview:",
        evt.target.result.substring(0, 100)
      );

      emitFile({
        roomID,
        fileName: file.name,
        fileType: file.type,
        fileData: evt.target.result,
      });
    };
  };

  // const handleAddImage = () => {
  //   if (!imageUrl) return;

  //   try {
  //     new URL(imageUrl);
  //   } catch {
  //     alert("Please enter a valid URL");
  //     return;
  //   }

  //   const width = 200;
  //   const height = 200;

  //   const element = createElement({
  //     x1: mousePosition.x,
  //     y1: mousePosition.y,
  //     x2: mousePosition.x + width,
  //     y2: mousePosition.y + height,
  //     toolType: toolTypes.IMAGE,
  //     id: uuid(),
  //     src: imageUrl,
  //     color: selectedColor,
  //   });

  //   // Ensure dimensions are set
  //   element.width = width;
  //   element.height = height;

  //   // Update local state
  //   setSelectedElement(element);
  //   dispatch(updateElementInStore(element));

  //   // Emit to other users
  //   emitImageElement(element, roomID);

  //   // Close modal
  //   setOpenImageModel(false);
  //   setImageUrl("");

  //   console.log("Image element created and emitted:", element);
  // };

  const handleAddImage = () => {
    if (!imageUrl) return;

    try {
      new URL(imageUrl); // validate
    } catch {
      alert("Please enter a valid URL");
      return;
    }

    const img = new Image();
    img.src = imageUrl;

    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;

      const element = createElement({
        x1: mousePosition.x,
        y1: mousePosition.y,
        x2: mousePosition.x + width,
        y2: mousePosition.y + height,
        toolType: toolTypes.IMAGE,
        id: uuid(),
        src: imageUrl,
        color: selectedColor,
      });

      // Set correct dimensions
      element.width = width;
      element.height = height;

      // Update local state
      setSelectedElement(element);
      dispatch(updateElementInStore(element));

      // Emit to other users
      emitImageElement(element, roomID);

      // Close modal
      setOpenImageModel(false);
      setImageUrl("");

      console.log("Image element created and emitted:", element);
    };

    img.onerror = () => {
      alert("Failed to load image. Please check the URL.");
    };
  };

  return (
    <div>
      {role === "teacher" && (
        <>
          <Menu roomID={roomID} />
          {action === actions.WRITING ? (
            <textarea
              ref={textAreaRef}
              onBlur={handleTextareaBlur}
              style={{
                position: "absolute",
                top: selectedElement.y1 - 3,
                left: selectedElement.x1,
                font: "12px sans-serif",
                margin: 0,
                padding: 0,
                border: 0,
                outline: 0,
                resize: "auto",
                overflow: "visible",
                whiteSpace: "pre",
                background: "transparent",
              }}
            />
          ) : null}
        </>
      )}

      {openImageModel && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
            border: "1px solid #e5e7eb",
            zIndex: 1000,
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <input
            type="text"
            placeholder="Enter image URL"
            value={imageUrl || ""}
            onChange={(e) => setImageUrl(e.target.value)}
            style={{
              width: "300px",
              padding: "12px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              outline: "none",
              transition: "border-color 0.2s ease",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
            onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            onKeyPress={(e) => {
              if (e.key === "Enter" && imageUrl) {
                handleAddImage();
              }
            }}
          />
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={handleAddImage}
              disabled={!imageUrl}
              style={{
                padding: "10px 16px",
                backgroundColor: imageUrl ? "#3b82f6" : "#d1d5db",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: imageUrl ? "pointer" : "not-allowed",
                transition: "all 0.2s ease",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              }}
              onMouseOver={(e) => {
                if (imageUrl) e.target.style.backgroundColor = "#2563eb";
              }}
              onMouseOut={(e) => {
                if (imageUrl) e.target.style.backgroundColor = "#3b82f6";
              }}
            >
              Add Image
            </button>
            <button
              onClick={() => {
                setOpenImageModel(false);
                setImageUrl("");
              }}
              style={{
                padding: "10px 16px",
                backgroundColor: "#ef4444",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#dc2626")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#ef4444")}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {role === "student" && <CursorOverlay />}

      {role === "student" && showPopup && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            width: "280px",
            padding: "20px",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
            border: "1px solid #e5e7eb",
            zIndex: 1000,
          }}
        >
          <button
            onClick={() => {
              doNotSendData();
            }}
            style={{
              width: "100%",
              padding: "16px",
              backgroundColor: "#f59e0b",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 8px rgba(245, 158, 11, 0.3)",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#d97706")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#f59e0b")}
          >
            <h2
              style={{
                margin: "0 0 8px 0",
                fontSize: "18px",
                fontWeight: "600",
              }}
            >
              Are You Awake?
            </h2>
            <p style={{ margin: "0", fontSize: "14px", opacity: "0.9" }}>
              Press SPACE to confirm
            </p>
          </button>
        </div>
      )}

      <canvas
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        ref={canvasRef}
        className={moveCanvas}
        width={window.innerWidth}
        height={window.innerHeight}
        id="canvas"
      />

      {role === "teacher" && sleptStudent && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            left: "20px",
            padding: "12px 20px",
            backgroundColor: "#dc2626",
            color: "#ffffff",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            boxShadow: "0 4px 12px rgba(220, 38, 38, 0.3)",
            zIndex: 1000,
          }}
        >
          {sleptStudent} is sleeping
        </div>
      )}

      {openChatModal && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "400px",
            maxHeight: "500px",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
            border: "1px solid #e5e7eb",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              flex: "1",
              padding: "16px",
              maxHeight: "350px",
              overflowY: "auto",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  marginBottom: "8px",
                  padding: "8px 12px",
                  backgroundColor: "#f8fafc",
                  borderRadius: "8px",
                  fontSize: "14px",
                  lineHeight: "1.4",
                }}
              >
                <strong>from: {msg.userID}</strong>: {msg.message}
              </div>
            ))}
          </div>
          <div
            style={{
              padding: "16px",
              display: "flex",
              gap: "8px",
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              style={{
                flex: "1",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                transition: "border-color 0.2s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />
            <button
              onClick={() => {
                handleSendChat();
              }}
              style={{
                padding: "10px 16px",
                backgroundColor: "#3b82f6",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#2563eb")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#3b82f6")}
            >
              Send
            </button>
            <button
              onClick={() => {
                setOpenChatModal(false);
              }}
              style={{
                padding: "10px 16px",
                backgroundColor: "#ef4444",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#dc2626")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#ef4444")}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {role === "teacher" && (
        <button
          onClick={() => setPoleDialogue(true)}
          style={{
            position: "fixed",
            right: "125px",
            top: "20px",
            padding: "12px 20px",
            backgroundColor: "#8b5cf6",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: "0 2px 8px rgba(139, 92, 246, 0.3)",
            zIndex: 1000,
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#7c3aed")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#8b5cf6")}
        >
          Conduct Poll
        </button>
      )}

      {role === "teacher" && poleDialogue && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "450px",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
            border: "1px solid #e5e7eb",
            zIndex: 1000,
            padding: "24px",
          }}
        >
          <h3
            style={{
              margin: "0 0 20px 0",
              fontSize: "18px",
              fontWeight: "600",
              color: "#111827",
              textAlign: "center",
            }}
          >
            Please select the correct answer
          </h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {[1, 2, 3, 4].map((option) => (
              <button
                key={option}
                onClick={() => {
                  manageQuizClick(option);
                }}
                style={{
                  padding: "14px 20px",
                  backgroundColor: "#f8fafc",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = "#e0e7ff";
                  e.target.style.borderColor = "#3b82f6";
                  e.target.style.transform = "translateY(-1px)";
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = "#f8fafc";
                  e.target.style.borderColor = "#d1d5db";
                  e.target.style.transform = "translateY(0)";
                }}
              >
                Option {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {role === "student" && quizAnswer && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "450px",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
            border: "1px solid #e5e7eb",
            zIndex: 1000,
            padding: "24px",
          }}
        >
          <h3
            style={{
              margin: "0 0 20px 0",
              fontSize: "18px",
              fontWeight: "600",
              color: "#111827",
              textAlign: "center",
            }}
          >
            Please select the correct answer
          </h3>

          {pollResult && (
            <div
              style={{
                margin: "0 0 20px 0",
                padding: "16px",
                backgroundColor: "#f0f9ff",
                borderRadius: "8px",
                border: "1px solid #0ea5e9",
              }}
            >
              <h2
                style={{
                  margin: "0",
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#0ea5e9",
                  textAlign: "center",
                }}
              >
                {resultPoll}
              </h2>
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {[1, 2, 3, 4].map((option) => (
              <button
                key={option}
                onClick={() => {
                  handleStudentAnswer(option);
                }}
                style={{
                  padding: "14px 20px",
                  backgroundColor: "#f8fafc",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = "#e0e7ff";
                  e.target.style.borderColor = "#3b82f6";
                  e.target.style.transform = "translateY(-1px)";
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = "#f8fafc";
                  e.target.style.borderColor = "#d1d5db";
                  e.target.style.transform = "translateY(0)";
                }}
              >
                Option {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI Search Button */}
      <button
        onClick={() => setAISearchOpen(true)}
        style={{
          position: "fixed",
          top: "20px",
          left: "20px",
          width: "40px",
          height: "40px",
          backgroundColor: "#ffffff",
          border: "1px solid #d1d5db",
          borderRadius: "8px",
          cursor: "pointer",
          transition: "all 0.2s ease",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          zIndex: 1000,
        }}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = "#f8fafc";
          e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = "#ffffff";
          e.target.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
        }}
      >
        <img
          src={AI}
          alt="AI Search"
          style={{
            height: "24px",
            width: "24px",
          }}
        />
      </button>

      {AISearchOpen && (
        <AiSearchPopup userID={userID} onClose={setAISearchOpen} />
      )}

      {/* Open Chat Button */}
      <button
        onClick={() => setOpenChatModal(true)}
        style={{
          position: "fixed",
          right: "10px",
          top: "20px",
          padding: "12px 20px",
          backgroundColor: "#10b981",
          color: "#ffffff",
          border: "none",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: "500",
          cursor: "pointer",
          transition: "all 0.2s ease",
          boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
          zIndex: 1000,
        }}
        onMouseOver={(e) => (e.target.style.backgroundColor = "#059669")}
        onMouseOut={(e) => (e.target.style.backgroundColor = "#10b981")}
      >
        Open Chat
      </button>

      {/* PDF Viewer Toggle Button */}
      <button
        onClick={() => setShowPdf(true)}
        style={{
          position: "fixed",
          top: "20px",
          left: role === "student" ? "80px" : "200px",
          width: "40px",
          height: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffffffff",
          borderRadius: "25%",
          border: "none",
          cursor: "pointer",
          transition: "all 0.2s ease",
          boxShadow: "0 4px 12px rgba(138, 134, 136, 0.3)",
          zIndex: 1000,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.backgroundColor = "#ccccccff";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.backgroundColor = "#ffffffff";
        }}
      >
        <img
          src={pdfImage}
          alt="pdfimage"
          style={{
            color: "#ffffff",
            height: "30px",
            width: "30px",
          }}
        />
      </button>

      {/* File Upload Section - Teacher Only */}
      {role === "teacher" && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            left: "80px",
          }}
        >
          <input
            id="file-upload"
            type="file"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <label
            htmlFor="file-upload"
            style={{
              display: "inline-block",
              padding: "12px 20px",
              backgroundColor: "#6366f1",
              color: "#ffffff",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#4f46e5")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#6366f1")
            }
          >
            Upload File
          </label>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {(showPdf ||
        (file &&
          ((typeof file === "string" && file.includes("application/pdf")) ||
            (typeof file === "object" &&
              ((file.fileType && file.fileType.includes("pdf")) ||
                (file.fileName &&
                  file.fileName.toLowerCase().endsWith(".pdf"))))))) && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90vw",
            maxWidth: "1200px",
            height: "80vh",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
            border: "1px solid #e5e7eb",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* PDF Viewer Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 20px",
              borderBottom: "1px solid #e5e7eb",
              backgroundColor: "#f8fafc",
            }}
          >
            <h3
              style={{
                margin: "0",
                fontSize: "18px",
                fontWeight: "600",
                color: "#111827",
              }}
            >
              {file && file.fileName ? file.fileName : "PDF Document"}
            </h3>
            <button
              onClick={() => {
                setShowPdf(false);
                dispatch(clearFile());
              }}
              style={{
                padding: "8px 16px",
                backgroundColor: "#ef4444",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#dc2626")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#ef4444")}
            >
              Close PDF
            </button>
          </div>

          {/* PDF Viewer Content */}
          <div
            style={{
              flex: "1",
              display: "flex",
              flexDirection: "column",
              padding: "20px",
              gap: "16px",
              overflow: "auto",
            }}
          >
            <div style={{ flex: "2", minHeight: "400px" }}>
              <PdfViewer />
            </div>

            <div
              style={{
                flex: "1",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <WebsiteShareControl
                roomID={roomID}
                userID={userID}
                isTeacher={role === "teacher"}
              />
              {/* <WebsiteDisplay roomID={roomID} userID={userID} /> */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Whiteboard;
