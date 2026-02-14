import { configureStore } from "@reduxjs/toolkit";
// import reducer from "components/todoList/features";
import { apiSlice, registerOfflineMutationExecutors } from "./components/todoList/services/apiSlice";
import authReducer from './components/todoList/features/authSlice';
import { loadAuthInfo, saveAuthInfo } from "./localStorage";

const preloadedState = { auth: loadAuthInfo() };

export const store = configureStore({
  preloadedState,
  reducer: {
    auth: authReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

registerOfflineMutationExecutors(store);

store.subscribe(() => {
  saveAuthInfo(store.getState());
});

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
