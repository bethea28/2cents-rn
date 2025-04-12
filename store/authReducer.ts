// features/auth/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  isAuthenticated: boolean;
  user?: any; //  Define a proper user type
  accessToken?: string; // Optional, for in-memory access
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: {
    userId: null,
    lastName: null,
    firstName: null,
    userName: null,
    email: null,
  },
  accessToken: undefined,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (
      state,
      action: PayloadAction<{ user: any; accessToken?: string }>
    ) => {
      console.log("USER ACTIONS NOW bryan now", action.payload);
      state.isAuthenticated = true;
      state.accessToken = action.payload.accessToken;
      state.user.userId = action.payload?.id;
      state.user.email = action.payload?.email;
      state.user.userName = action.payload?.username;
      state.user.lastName = action.payload?.lastName;
      state.user.firstName = action.payload?.firstName;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.accessToken = undefined;
    },
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
    },
  },
});

export const { login, logout, setAccessToken } = authSlice.actions;
export default authSlice;
