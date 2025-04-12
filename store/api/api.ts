import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
// import { objectToUrlEncodedString } from "./helpers";
import { useAuthTokens } from "@/app/customHooks";

// Define your auth slice (assuming you have one)
import { useDispatch } from "react-redux"; // To dispatch actions
import authSlice from "../authReducer";
export const api = createApi({
  reducerPath: "api",
  baseQuery: async (args, api, extraOptions) => {
    const { getAccessToken, getRefreshToken, storeTokens, clearTokens } =
      useAuthTokens();
    const dispatch = useDispatch(); // Get the dispatch function

    const rawBaseQuery = fetchBaseQuery({
      baseUrl: "http://192.168.1.161:3000/", // Your API base URL
      prepareHeaders: async (headers, { getState }) => {
        const accessToken = await getAccessToken();
        if (accessToken) {
          headers.set("Authorization", `Bearer ${accessToken}`);
        }
        return headers;
      },
    });

    let result = await rawBaseQuery(args, api, extraOptions);

    // Check for unauthorized error (typically 401)
    if (result?.error?.status === 401) {
      const refreshToken = await getRefreshToken();

      if (refreshToken) {
        try {
          const refreshResult = await fetch(
            "http://192.168.1.161:3000/auth/refresh", // Your refresh token endpoint
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: objectToUrlEncodedString({ refreshToken }),
            }
          );

          if (refreshResult.ok) {
            const newTokens = await refreshResult.json();
            // Store the new tokens using your hook
            await storeTokens(newTokens.accessToken, newTokens.refreshToken);
            // Dispatch action to update the authentication state in Redux
            dispatch(authSlice.actions.setTokens(newTokens));
            // Retry the original request with the new access token
            result = await rawBaseQuery(args, api, extraOptions);
          } else {
            // Refresh failed, clear tokens and dispatch logout
            await clearTokens();
            dispatch(authSlice.actions.logout());
          }
        } catch (error) {
          console.error("Error during token refresh:", error);
          await clearTokens();
          dispatch(authSlice.actions.logout());
        }
      } else {
        // No refresh token, clear tokens and dispatch logout
        await clearTokens();
        dispatch(authSlice.actions.logout());
      }
    }

    return result;
  },
  tagTypes: [
    "myShifts",
    "shiftsToGrab",
    "upComingShifts",
    "teamShifts",
    "swapAlerts",
    "accountInfo",
    "alertsSettings",
    "unavailabilityCalendar",
    "payHistory",
    "empRequests",
  ],
  endpoints: (build) => ({
    getWeather: build.query<any, void>({
      queryFn: async () => {
        const req = await fetch("https://api.escuelajs.co/api/v1/products");
        const resp = await req.json();
        return { data: resp };
      },
    }),
    getBooks: build.query({
      query: () => ({}),
    }),
    getDjango: build.query({
      query: (data) => ({
        url: "bryan/bookPost",
        method: "POST",
        body: objectToUrlEncodedString(data), // Assuming you might pass data here
      }),
    }),
    googleAuth: build.mutation<any, any>({
      query: (data) => ({
        url: "authentication/googleAuth/",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userData: data,
        }),
      }),
    }),
    authLogin: build.mutation<any, any>({
      query: (data) => ({
        url: "auth/login",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: objectToUrlEncodedString({
          email: data.email,
          password: data.password,
        }),
      }),
    }),
    createStory: build.mutation<any, any>({
      query: (data) => ({
        url: "createStory",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: objectToUrlEncodedString({
          email: data.email,
          password: data.password,
        }),
      }),
    }),
    addBook: build.mutation<any, any>({
      query: (data) => ({
        url: "bryan/bookPost/",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: objectToUrlEncodedString({
          title: data.title,
          author: data.author,
          year: data?.year,
        }),
      }),
    }),
    addReview: build.mutation<any, any>({
      query: (data) => ({
        url: `reviews/${data.userId}/${data.companyId}/addReview/`,
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: JSON.stringify({
          rating: data.rating,
          review: data.review,
        }),
      }),
    }),
    addFeedback: build.mutation<any, any>({
      query: (data) => ({
        url: `feedback/addFeedback/`,
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: JSON.stringify({
          feedback: data.feedback,
        }),
      }),
    }),
    addCompany: build.mutation<any, any>({
      query: (data) => ({
        url: `company/${data?.userId}/addUnverifiedCompany/`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyInfo: data.companyInfo,
          imageUrls: data.allImages,
          hoursData: data.hoursData,
        }),
      }),
    }),
    getReviews: build.query({
      query: (data) => ({
        url: `reviews/${data.companyId}/getReviews/`,
        params: {},
      }),
    }),
    getCompanies: build.query({
      query: () => ({
        url: "company/getCompanies/",
        params: {},
      }),
    }),
    // ... (rest of your endpoints)
  }),
  refetchOnMountOrArgChange: true,
});

export const {
  useAuthLoginMutation,
  useGetBooksQuery,
  useGetWeatherQuery,
  useGetDjangoQuery,
  useGetCompaniesQuery,
  useAddReviewMutation,
  useAddCompanyMutation,
  useGoogleAuthMutation,
  useGetReviewsQuery,
  useAddFeedbackMutation,
  useGetMyShiftsQuery,
  useGetCalendarDataQuery,
  useApiSessionQuery,
  useGetSchedulesQuery,
  useGetPayrollGroupQuery,
  useGetShiftsToGrabQuery,
  useOfferShiftRequestMutation,
  useGrabShiftRequestMutation,
  useGetTeamShiftsQuery,
  useGetAccountInfoQuery,
  useGetPTORequestsQuery,
  useGetAlertsSettingsQuery,
  useToggleAllowAlertsMutation,
  useSetAlertMutation,
  useGetSwapAlertsQuery,
  useGetUpcomingShiftsQuery,
  useGetManagersOnDutyQuery,
  useProposeShiftSwapMutation,
  useShiftManagementApprovalMutation,
  useGetPTOQuery,
  useSubmitPTOMutation,
  useCancelTimeOffMutation,
  useGetTodayWeatherQuery,
  useGetUnavailabilityCalendarQuery,
  useGetPayHistoryQuery,
  useGetNotficationAlertsQuery,
  useSubmitUnavailabilityMutation,
  useCancelUnavailabilityRequestMutation,
  useSubmitMessgeMutation,
  useSubscribeForPushNotificationsMutation,
  useIsPublishedQuery,
  usePublishedCountsQuery,
  useGetSwappableShiftsQuery,
  useGetMyRequestsQuery,
} = api;
