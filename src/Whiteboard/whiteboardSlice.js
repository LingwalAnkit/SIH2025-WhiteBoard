import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  tool: null,
  elements: [],
  slepingStudent: null,
  messages: [{}],
  quizAnswer: null,
  selectedColor: "#000000",
};

const whiteboardSlice = createSlice({
  name: "whiteboard",
  initialState,
  reducers: {
    setToolType: (state, action) => {
      state.tool = action.payload;
    },
    updateElement: (state, action) => {
      const { id } = action.payload;

      const index = state.elements.findIndex((element) => element.id === id);

      if (index === -1) {
        state.elements.push(action.payload);
      } else {
        state.elements[index] = action.payload;
      }
    },
    setElements: (state, action) => {
      state.elements = action.payload;
    },
    setSleepingStudent: (state, action) => {
      state.slepingStudent = action.payload;
    },
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    setQuizAnswer: (state, action) => {
      state.quizAnswer = action.payload;
    },
    setSelectedColor: (state, action) => {
      state.selectedColor = action.payload;
    },
    // Add this new reducer for removing elements
    // In your whiteboardSlice.js - verify this reducer
    removeElement: (state, action) => {
      const elementId = action.payload;
      console.log(
        `Removing element ${elementId} from state. Before: ${state.elements.length} elements`
      );

      state.elements = state.elements.filter(
        (element) => element.id !== elementId
      );

      console.log(`After removal: ${state.elements.length} elements`);
    },
  },
});

export const {
  setToolType,
  updateElement,
  setElements,
  setSleepingStudent,
  setMessages,
  setQuizAnswer,
  setSelectedColor,
  removeElement, // Add this export
} = whiteboardSlice.actions;

export default whiteboardSlice.reducer;
