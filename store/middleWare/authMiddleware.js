// middleware/authMiddleware.js
import { isRejectedWithValue } from "@reduxjs/toolkit";
import { refreshAccessToken } from "../api/auth"; // Ensure this path is correct
import { useAuthTokens } from "@/app/customHooks"; // Ensure this path is correct

export const authMiddleware = (api) => (next) => async (action) => {
  const { getAccessToken, getRefreshToken, storeTokens, clearTokens } =
    useAuthTokens();

  // Add Authorization header if accessToken exists
  if (action.meta?.requestHeaders) {
    const accessToken = await getAccessToken();
    if (accessToken) {
      action.meta.requestHeaders.set("Authorization", `Bearer ${accessToken}`);
    }
  }

  // Handle potential token expiration (401 Unauthorized)
  if (isRejectedWithValue(action) && action.payload?.status === 401) {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      try {
        const refreshResult = await refreshAccessToken({ refreshToken });
        if (refreshResult?.data?.accessToken) {
          // Store the new access token (and potentially a new refresh token) in AsyncStorage
          await storeTokens(
            refreshResult.data.accessToken,
            refreshResult.data?.refreshToken || refreshToken // Use new refresh token if provided
          );

          // Retry the original request
          const originalRequest = action.meta.baseQueryArgs;
          return api.dispatch(originalRequest);
        } else {
          // Refresh failed, clear tokens and signal logout
          await clearTokens();
          api.dispatch({ type: "AUTH_LOGOUT" });
          // Consider preventing the original action from proceeding
          return;
        }
      } catch (refreshError) {
        console.error("Error refreshing token:", refreshError);
        await clearTokens();
        api.dispatch({ type: "AUTH_ERROR", payload: refreshError.message });
        return;
      }
    } else {
      // No refresh token, clear tokens and signal authentication required
      await clearTokens();
      api.dispatch({ type: "AUTH_REQUIRED" });
      return;
    }
  }

  return next(action);
};
