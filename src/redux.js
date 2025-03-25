import { configureStore } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage"; // Use localStorage for persistence
import { combineReducers } from "redux";

// Initialize state based on persisted data
const getInitialState = () => {
  const persistedState = localStorage.getItem("persist:root");
  if (persistedState) {
    const parsedState = JSON.parse(persistedState);
    const authState = JSON.parse(parsedState.auth || "{}");
    return {
      user: authState.user || null,
      token: authState.token || null,
      isAuthenticated: !!authState.token, // True if token exists
      identity: authState.identity || 0, // 0 for user, 1 for admin
      name: authState.name || null,
    };
  }
  return {
    user: null,
    token: null,
    isAuthenticated: false,
    identity: 0,
    name: null,
  };
};

const initialState = getInitialState();

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload.email;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.name = action.payload.name;
      state.identity = action.payload.identity || 0; // Default to 0 if not provided
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.identity = 0;
      state.name = null;
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;

const persistConfig = {
  key: "root",
  storage,
};

const rootReducer = combineReducers({
  auth: authSlice.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export const persistor = persistStore(store);
export default store;