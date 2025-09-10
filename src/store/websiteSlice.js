
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    websiteUrl: null,
    sharedBy: null,
    isDisplaying: false,
    isSharing: false // Add this new state
};

export const websiteSlice = createSlice({
    name: "website",
    initialState,
    reducers: {
        setSharedWebsite: (state, action) => {
            const { websiteUrl, sharedBy } = action.payload;
            state.websiteUrl = websiteUrl;
            state.sharedBy = sharedBy;
            state.isDisplaying = true;
            state.isSharing = true; // Set sharing to true when website is shared
        },
        closeSharedWebsite: (state) => {
            state.isDisplaying = false;
            state.isSharing = false; // Reset sharing state when website is closed
        },
        clearSharedWebsite: (state) => {
            state.websiteUrl = null;
            state.sharedBy = null;
            state.isDisplaying = false;
            state.isSharing = false;
        },
        // Add a new reducer specifically for resetting the sharing state
        resetSharingState: (state) => {
            state.isSharing = false;
        }
    },
});

export const {
    setSharedWebsite,
    closeSharedWebsite,
    clearSharedWebsite,
    resetSharingState
} = websiteSlice.actions;

export default websiteSlice.reducer;