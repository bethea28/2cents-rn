import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  } | null;
  isInitializing: boolean;
}

const initialState: AuthState = {
  user: null,
  isInitializing: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<AuthState['user']>) => {
      // ✅ Proper way to log without breaking the state mutation
      console.log('MIGOS FLASH: Setting User...', action.payload);

      state.user = action.payload;
      state.isInitializing = false;
    },
    clearUser: (state) => {
      state.user = null;
      state.isInitializing = false;
    },
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;