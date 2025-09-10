import { io } from "socket.io-client";
import pako from "pako";
import {
  removeCursorPosition,
  updateCursorPosition,
} from "../CursorOverlay/cursorSlice";
import {
  clearAudioStream,
  setActiveAudioSource,
  setAudioStream,
} from "../store/audioSlice";
import { setFile } from "../store/fileSlice";
import { setAnswerFromAI } from "../store/questionSlice";
import { store } from "../store/store";
import {
  setElements,
  setMessages,
  setQuizAnswer,
  setSleepingStudent,
  updateElement,
  removeElement, // Add this import
} from "../Whiteboard/whiteboardSlice";
import { resetSharingState, setSharedWebsite } from "../store/websiteSlice";

let socket;

function dataURLtoBlob(dataurl) {
  const parts = dataurl.split(",");
  const mime = parts[0].match(/:(.*?);/)[1];
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

export const connectWithSocketServer = (roomID, userID) => {
  socket = io("http://localhost:3003");
  console.log(`room ID from connect to socket : : ${roomID} : : ${userID}`);

  socket.on("connect", () => {
    console.log("connected to socket.io server");
    socket.emit("join-room", { userID, roomID });
  });

  socket.on("whiteboard-state", (data) => {
    const { elements } = data;
    store.dispatch(setElements(elements));
  });

  socket.on("user-disconnected", ({ userID }) => {
    console.log(`User with ID ${userID} has disconnected.`);
  });

  socket.on("element-update", (elementData) => {
    console.log("Client received element:", elementData.type, elementData.id);
    if (elementData.type === "image") {
      console.log(
        "Received image:",
        elementData.src,
        elementData.width,
        elementData.height
      );
    }
    store.dispatch(updateElement(elementData));
  });

  // Add this new socket listener for element removal
  socket.on("element-removal", ({ elementId }) => {
    console.log(`Received element removal for ID: ${elementId}`);
    store.dispatch(removeElement(elementId));
  });

  socket.on("whiteboard-clear", () => {
    setTimeout(() => {
      store.dispatch(setElements([]));
    }, 500);
  });

  socket.on("student-sleeping", (userID) => {
    console.log(`\n\nStudent ID is sleeping : : : ${userID}`);
    store.dispatch(setSleepingStudent(userID));

    setTimeout(() => {
      store.dispatch(setSleepingStudent(null));
    }, 8000);
  });

  socket.on("cursor-position", (cursorData) => {
    setTimeout(() => {
      store.dispatch(updateCursorPosition(cursorData));
    }, 500);
  });

  socket.on("user-disconnected", (disconnectedUserId) => {
    store.dispatch(removeCursorPosition(disconnectedUserId));
  });

  socket.on("message", (compressedMessage) => {
    try {
      // Decompress
      const binaryString = atob(compressedMessage);
      const charCodes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        charCodes[i] = binaryString.charCodeAt(i);
      }
      const decompressed = pako.inflate(charCodes, { to: "string" });
      console.log(JSON.parse(decompressed));
      const { userID, message, roomID, messageCopy } = JSON.parse(decompressed);
      console.log(`ssdbasjkdsa\n\n\nsadkhbask : ${userID}`);

      // const decompressed = pako.inflate(compressedMessage, { to: "string" });
      // const message = JSON.parse(decompressed);

      console.log("Received message:", message);

      // Example usage:
      store.dispatch(setMessages(messageCopy));
    } catch (err) {
      console.error("Decompression failed:", err);
    }
  });

  socket.on("quiz", ({ correctAnswer }) => {
    store.dispatch(setQuizAnswer(correctAnswer));
    console.log(`correct from socket.on ${correctAnswer}`);

    setTimeout(() => {
      store.dispatch(setQuizAnswer(null));
    }, 1 * 15 * 500);
  });

  socket.on("got-definition", (result) => {
    console.log(result);
    store.dispatch(setAnswerFromAI(result));
  });

  socket.on("file-media", (compressedFileData) => {
    console.log("Received compressed media file");
    try {
      const decompressed = pako.inflate(compressedFileData, { to: "string" });
      const { fileName, fileType, fileData } = JSON.parse(decompressed);

      console.log("Decompressed file:", fileName, fileType);
      store.dispatch(setFile(fileData)); // Set the data URL directly
    } catch (error) {
      console.error("Error processing compressed file:", error);
    }
  });

  socket.on("file-url", ({ fileName, fileType, fileData }) => {
    console.log("Received URL/Text file:", fileName, fileType);
    store.dispatch(setFile(fileData));
  });

  socket.on("file-other", (compressedFileData) => {
    console.log("Received other compressed file");
    try {
      const decompressed = pako.inflate(compressedFileData, { to: "string" });
      const { fileName, fileType, fileData } = JSON.parse(decompressed);
      store.dispatch(setFile(fileData));
    } catch (error) {
      console.error("Error processing other file:", error);
    }
  });

  // ✅ Update existing listener
  socket.on("file-rechieved", ({ fileName, fileType, fileData }) => {
    console.log("Received file via file-received:", fileName, fileType);
    store.dispatch(setFile(fileData));
  });

  socket.on("website-shared", ({ websiteUrl, userID }) => {
    console.log(`Received website URL: ${websiteUrl} from user: ${userID}`);
    store.dispatch(setSharedWebsite({ websiteUrl, sharedBy: userID }));
  });

  socket.on("website-closed", ({ userID, roomID }) => {
    console.log(`Website sharing closed by user: ${userID} in room: ${roomID}`);
    store.dispatch(resetSharingState());
  });

  socket.on("audioStream", ({ audioData, userID }) => {
    try {
      if (!audioData) return;

      const newData = audioData.split(";");
      newData[0] = "data:audio/ogg;";
      const processedAudioSrc = newData[0] + newData[1];

      store.dispatch(setAudioStream(processedAudioSrc));
      store.dispatch(setActiveAudioSource(userID));

      const audio = new Audio(processedAudioSrc);
      audio.play().catch((error) => {
        console.error("Error playing audio:", error);
        store.dispatch(clearAudioStream());
      });
    } catch (error) {
      console.error("Error processing audio stream:", error);
      store.dispatch(clearAudioStream());
    }
  });
};

export const emitElementUpdate = (elementData, roomID) => {
  console.log(`\n\n\n\nElement DAta : \n\n ${JSON.stringify(elementData)}`);
  // Ensure all properties are preserved, especially for images
  const completeElementData = {
    ...elementData,
    // Explicitly preserve image source and dimensions if it exists
    ...(elementData.type === "image" && {
      src: elementData.src,
      width: elementData.width,
      height: elementData.height,
    }),
  };

  console.log("Emitting element update:", completeElementData);
  socket.emit("element-update", { elementData: completeElementData, roomID });
};

export const emitImageElement = (imageElementData, roomID) => {
  console.log("Emitting image element:", imageElementData);
  const completeImageData = {
    ...imageElementData,
    type: "image",
    src: imageElementData.src,
    width:
      imageElementData.width ||
      Math.abs(imageElementData.x2 - imageElementData.x1) ||
      200,
    height:
      imageElementData.height ||
      Math.abs(imageElementData.y2 - imageElementData.y1) ||
      200,
    x1: imageElementData.x1,
    y1: imageElementData.y1,
    x2: imageElementData.x2,
    y2: imageElementData.y2,
    id: imageElementData.id,
  };

  // Use element-update to maintain consistency
  socket.emit("element-update", {
    elementData: completeImageData,
    roomID,
  });
};

// In your socketConn.js file
export const emitElementRemoval = (elementId, roomID) => {
  console.log(
    `Emitting element removal for ID: ${elementId} in room: ${roomID}`
  );

  socket.emit("element-removal", { elementId, roomID });
};

export const emitClearWhiteboard = (roomID) => {
  socket.emit("whiteboard-clear", roomID);
};

export const emitCursorPosition = ({ cursorData, roomID }) => {
  socket.emit("cursor-position", { cursorData, roomID });
};

export const emitStudentSleeping = (userID, roomID) => {
  console.log(`Student ID : : ${userID}, room ID : : : : : ${roomID}`);
  socket.emit("student-sleeping", { userID, roomID });
};

export const emitMessages = ({ userID, message, roomID, messageCopy }) => {
  const jsonString = JSON.stringify({ userID, message, roomID, messageCopy });
  const compressed = pako.deflate(jsonString);
  socket.emit("message", {
    roomID: roomID,
    compressedMessage: btoa(String.fromCharCode(...compressed)),
  });
};

export const quiz = ({ correctAnswer, roomID }) => {
  console.log(`correct asnwer :  :${correctAnswer}`);
  socket.emit("quiz", { correctAnswer, roomID });
};

export const emitAudioStream = ({ audioData, roomID, userID }) => {
  socket.emit("audioStream", {
    audioData,
    roomID,
    userID,
  });
};

export const emitQuestion = ({ userID, question }) => {
  console.log("emit question trigerred !!", userID);
  socket.emit("get-definition", { userID, question });
};

export const emitFile = ({ roomID, fileName, fileType, fileData }) => {
  const data = fileData || fileName;
  const blob =
    typeof data === "string"
      ? dataURLtoBlob(data)
      : new Blob([data], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  console.log("Generated blob URL:", url);
  store.dispatch(setFile(url));
  socket.emit("file", { roomID, fileName, fileType, fileData });
};

export const emitWebsiteShare = ({ websiteUrl, roomID, userID }) => {
  try {
    new URL(websiteUrl);
    socket.emit("share-website", { websiteUrl, roomID, userID });
    console.log(`Sharing website: ${websiteUrl} in room: ${roomID}`);
  } catch (error) {
    console.error("Invalid URL format:", error);
  }
};

export const emitWebsiteClosed = ({ roomID, userID }) => {
  socket.emit("website-closed", { roomID, userID });
  console.log(`Closing website sharing in room: ${roomID}`);
};
