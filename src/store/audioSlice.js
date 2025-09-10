import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  audioStream: null,
  isAudioStreaming: false,
  activeAudioSource: null,
};

const audioSlice = createSlice({
  name: 'audioStreaming',
  initialState,
  reducers: {
    setAudioStream: (state, action) => {
      state.audioStream = action.payload;
      state.isAudioStreaming = !!action.payload;
    },
    clearAudioStream: (state) => {
      state.audioStream = null;
      state.isAudioStreaming = false;
    },
    setActiveAudioSource: (state, action) => {
      state.activeAudioSource = action.payload;
    },
    clearActiveAudioSource: (state) => {
      state.activeAudioSource = null;
    }
  }
});

export const { 
  setAudioStream, 
  clearAudioStream, 
  setActiveAudioSource, 
  clearActiveAudioSource 
} = audioSlice.actions;

export default audioSlice.reducer;