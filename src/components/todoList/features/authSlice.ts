// src/store/authSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  token: string | null;
  user: {
    firstName: string;
    lastName: string;
  }
}

const initialState: AuthState = {
  token: null,
  user: {
    firstName: '',
    lastName: '',
  }
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<AuthState['token']>) => {
      state.token = action.payload;
    },
    setUser(state, action: PayloadAction<AuthState['user']>) {
      state.user = action.payload;
    }
  },
});

export const { setToken, setUser } = authSlice.actions;

export default authSlice.reducer;
