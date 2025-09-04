
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, AuthUser } from "../../types/auth";
import { loadAuth, saveAuth, clearAuth } from "../../lib/storage";

const initial = loadAuth();
const initialState: AuthState = {
  token: initial.token,
  user: initial.user,
};

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; user: AuthUser }>
    ) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      saveAuth(action.payload.token, action.payload.user);
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      clearAuth();
    },
  },
});

export const { setCredentials, logout } = slice.actions;
export default slice.reducer;
