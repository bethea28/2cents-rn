import AsyncStorage from "@react-native-async-storage/async-storage";
import { combineReducers, configureStore, Middleware } from "@reduxjs/toolkit";
import {
  persistReducer,
  persistStore,
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
} from "redux-persist";
import { RESET_STORE_ACTION } from "./actions";
import authSlice from "./authSlice"; // Use the one we created earlier
import { counterSlice } from "./globalState/globalState";
import { userReducer } from "./userReducer";
import { testReducer } from "./testReducer";
import { api } from "./api/api";
// import { pokemonApi } from "./api/pokemonApi"; // Ensure this is imported if used

const rootReducer = combineReducers({
  user: userReducer,
  test: testReducer,
  auth: authSlice,
  [counterSlice.reducerPath]: counterSlice.reducer,
  [api.reducerPath]: api.reducer,
  // [pokemonApi.reducerPath]: pokemonApi.reducer, // Uncomment if you actually have this
});

const persistedReducer = persistReducer(
  {
    key: "root",
    storage: AsyncStorage,
    whitelist: ["settings", "user", "auth"], // PERSIST AUTH to keep user logged in
  },
  rootReducer
);

const resettableRootReducer: typeof persistedReducer = (state, action) => {
  if (action.type === RESET_STORE_ACTION.type) {
    AsyncStorage.removeItem("persist:root").catch(() => { });
    return persistedReducer(undefined, action);
  }
  return persistedReducer(state, action);
};

export const store = configureStore({
  reducer: resettableRootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Firebase and Persist actions often contain non-serializable data
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        serializableCheck: false, // Recommended for Firebase integrations
      },
    }).concat(api.middleware),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;