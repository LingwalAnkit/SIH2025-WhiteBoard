import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  filling: false,
  fillStyle: "hachure",
};

const fillmode = createSlice({
  name: "fill",
  initialState,
  reducers: {
    setFillMode: (state, action) => {
      state.filling = action.payload;
    },
    setFillStyle: (state, action) => {
      state.fillStyle = action.payload;
    },
  },
});

export const { setFillMode, setFillStyle } = fillmode.actions;
export default fillmode.reducer;
