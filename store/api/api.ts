import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
// import { objectToUrlEncodedString } from "./helpers";
// import {objecttourl}
import { useAuthTokens } from "@/app/customHooks";

// Define your auth slice (assuming you have one)
import { useDispatch } from "react-redux"; // To dispatch actions
import authSlice from "../authReducer";

export const objectToUrlEncodedString = (
  obj: Record<string, string | number>
) => {
  // @ts-ignore
  const urlEncoded = new URLSearchParams(obj);
  return urlEncoded.toString();
};

import AsyncStorage from "@react-native-async-storage/async-storage"; // Assuming you're using this

const createMyBaseQuery = () => {
  return async (args, api, extraOptions) => {
    const getAccessToken = async () => {
      try {
        const accessToken = await AsyncStorage.getItem("accessToken");
        return accessToken || null;
      } catch (error) {
        console.error("Error getting access token:", error);
        return null;
      }
    };

    const getRefreshToken = async () => {
      try {
        const refreshToken = await AsyncStorage.getItem("refreshToken");
        return refreshToken || null;
      } catch (error) {
        console.error("Error getting refresh token:", error);
        return null;
      }
    };

    const storeTokens = async (accessToken, refreshToken) => {
      try {
        await AsyncStorage.setItem("accessToken", accessToken);
        await AsyncStorage.setItem("refreshToken", refreshToken);
        console.log("Tokens stored successfully");
      } catch (error) {
        console.error("Error storing tokens:", error);
      }
    };

    const clearTokens = async () => {
      try {
        await AsyncStorage.removeItem("accessToken");
        await AsyncStorage.removeItem("refreshToken");
        console.log("Tokens cleared");
      } catch (error) {
        console.error("Error clearing tokens:", error);
      }
    };

    const rawBaseQuery = fetchBaseQuery({
      baseUrl: "http://192.168.1.161:3000/",
      prepareHeaders: async (headers, { getState }) => {
        const accessToken = await getAccessToken();
        if (accessToken) {
          headers.set("Authorization", `Bearer ${accessToken}`);
        }
        return headers;
      },
    });

    let result = await rawBaseQuery(args, api, extraOptions);
    const dispatch = api.dispatch;

    if (result?.error?.status === 401) {
      const refreshToken = await getRefreshToken();

      if (refreshToken) {
        try {
          const refreshResult = await fetch(
            "http://192.168.1.161:3000/auth/refresh",
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
            await storeTokens(newTokens.accessToken, newTokens.refreshToken);
            dispatch(authSlice.actions.setTokens(newTokens));
            result = await rawBaseQuery(args, api, extraOptions);
          } else {
            await clearTokens();
            dispatch(authSlice.actions.logout());
          }
        } catch (error) {
          console.error("Token refresh error:", error);
          await clearTokens();
          dispatch(authSlice.actions.logout());
        }
      } else {
        await clearTokens();
        dispatch(authSlice.actions.logout());
      }
    }

    return result;
  };
};
export const api = createApi({
  reducerPath: "api",
  baseQuery: createMyBaseQuery(),
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
      query: (data) =>
        console.log("greateness", data) || {
          url: "auth/login",
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: objectToUrlEncodedString({
            email: data.email,
            password: data.password,
          }),
        },
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
