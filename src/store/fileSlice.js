import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  file: null,
  url: null,
  fileName: null,
  fileType: null,
};

const fileSlice = createSlice({
  name: "file",
  initialState,
  reducers: {
    setFile: (state, action) => {
      console.log("=== REDUX SET FILE ===");
      console.log("Payload:", action.payload);
      console.log("Payload type:", typeof action.payload);

      if (typeof action.payload === "string") {
        // Legacy format - just a URL
        state.url = action.payload;
        state.file = action.payload;
        state.fileName = null;
        state.fileType = "application/pdf";
      } else if (action.payload && typeof action.payload === "object") {
        // New format - complete file object
        state.file = action.payload.file || action.payload;
        state.url = action.payload.url || action.payload.file;
        state.fileName = action.payload.fileName || null;
        state.fileType = action.payload.fileType || null;
      }

      console.log("New state:", {
        file: state.file ? "present" : "null",
        url: state.url ? "present" : "null",
        fileName: state.fileName,
        fileType: state.fileType,
      });
    },
    clearFile: (state) => {
      console.log("=== REDUX CLEAR FILE ===");
      state.file = null;
      state.url = null;
      state.fileName = null;
      state.fileType = null;
    },
  },
});

export const { setFile, clearFile } = fileSlice.actions;
export default fileSlice.reducer;
