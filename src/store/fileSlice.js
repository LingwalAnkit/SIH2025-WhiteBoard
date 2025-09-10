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
      if (typeof action.payload === "string") {
        // Legacy format - just a URL
        state.url = action.payload;
        state.file = action.payload;
      } else {
        // New format - object with url, fileName, fileType
        state.file = action.payload;
        state.url = action.payload.url;
        state.fileName = action.payload.fileName;
        state.fileType = action.payload.fileType;
      }
    },
    clearFile: (state) => {
      state.file = null;
      state.url = null;
      state.fileName = null;
      state.fileType = null;
    },
  },
});

export const { setFile, clearFile } = fileSlice.actions;
export default fileSlice.reducer;
