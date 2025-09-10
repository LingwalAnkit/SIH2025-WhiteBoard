import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  answerFromAI: "",
};

const aiSlice = createSlice({
  name: "ai",
  initialState,
  reducers: {
    setAnswerFromAI: (state, action) => {
      state.answerFromAI = action.payload;
    },
  },
});

export const { setAnswerFromAI } = aiSlice.actions;
export default aiSlice.reducer;
