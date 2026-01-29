import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  user: any | null; // Keeping as any for now since your backend nesting is complex
  token: string | null; // 🛡️ STAFF MOVE: Explicitly track the token
  isInitializing: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null, // 🛡️ Initialize as null
  isInitializing: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<any>) => {
      console.log('MIGOS FLASH: Setting User & Token...', action.payload);

      // 🛡️ Based on your logs, the payload likely contains both
      state.user = action.payload;

      // 🛡️ If the token is nested inside the payload, extract it here
      state.token = action.payload?.token || null;

      state.isInitializing = false;
    },
    clearUser: (state) => {
      // 🛡️ THE KILL SWITCH: Both must be null to trigger the MainApp Gatekeeper
      state.user = null;
      state.token = null;
      state.isInitializing = false;
      console.log('🛡️ STAFF LOG: Auth State Fully Purged');
    },
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;