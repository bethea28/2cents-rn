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
import { authTokenStore } from "@/app/customHooks";
// import AsyncStorage from "@react-native-async-storage/async-storage"; // Assuming you're using this

const createMyBaseQuery = () => {
  return async (args, api, extraOptions) => {
    const rawBaseQuery = fetchBaseQuery({
      // baseUrl: "http://192.168.1.157:3000/",
      baseUrl: "http://172.20.10.4:3000/", //hotspot iphone
      prepareHeaders: async (headers, { getState }) => {
        const accessToken = await authTokenStore.getAccessToken();
        if (accessToken) {
          headers.set("Authorization", `Bearer ${accessToken}`);
        }
        return headers;
      },
    });

    let result = await rawBaseQuery(args, api, extraOptions);
    const dispatch = api.dispatch;

    if (result?.error?.status === 401) {
      const refreshToken = await authTokenStore.getRefreshToken();

      if (refreshToken) {
        try {
          const refreshResult = await fetch(
            "http://192.168.1.157:3000/auth/refresh",
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
            await authTokenStore.storeTokens(
              newTokens.accessToken,
              newTokens.refreshToken
            );
            dispatch(authSlice.actions.setAccessToken(newTokens));
            result = await rawBaseQuery(args, api, extraOptions);
          } else {
            await authTokenStore.clearTokens();
            dispatch(authSlice.actions.logout());
          }
        } catch (error) {
          console.error("Token refresh error:", error);
          await authTokenStore.clearTokens();
          dispatch(authSlice.actions.logout());
        }
      } else {
        await authTokenStore.clearTokens();
        dispatch(authSlice.actions.logout());
      }
    }

    return result;
  };
};
export const api = createApi({
  reducerPath: "api",
  baseQuery: createMyBaseQuery(),
  tagTypes: [],
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
        console.log("LOGIN ATTEMPT", data) || {
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
    // createStory: build.mutation<any, any>({
    //   query: (data) =>
    //     console.log("create story data", data.formData) || {
    //       url: "stories/createStory",
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/x-www-form-urlencoded",
    //       },
    //       body: objectToUrlEncodedString({
    //         title: data.formData.title,
    //         storyType: data.formData.storyType,
    //         sideAContent: data.formData.sideAContent,
    //         sideBContent: data.formData.sideBContent,
    //         sideAVideoUrl: data.formData.sideAVideoUrl,
    //         sideBVideoUrl: data.formData.sideBVideoUrl,
    //         photos: data.formData.photos,
    //         sideAAuthorId: data.formData.sideAId,
    //         sideBAuthorId: data.formData.sideBId,
    //       }),
    //     },
    // }),

    createStory: build.mutation<any, FormData>({
      query: (formData) => console.log('story data final', formData) || ({
        url: "stories/createStory",
        method: "POST",
        // Note: Do NOT set Content-Type header here. 
        // RTK Query/Fetch will automatically set it to 'multipart/form-data' 
        // with the correct boundary when it sees you're passing FormData.
        body: formData,
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
    getAllStories: build.query({
      query: () => ({
        url: "stories/getAllStories/",
        params: {},
      }),
    }),
    getAllPendingStories: build.query({
      query: (data) => {
        console.log("pending all store", data);
        return {
          url: `stories/${data.userId}/getAllPendingStories/`,
          method: "GET",
        };
      },
    }),
    // ... (rest of your endpoints)
  }),
  refetchOnMountOrArgChange: true,
});

export const {
  useGetAllPendingStoriesQuery,
  useAuthLoginMutation,
  useGetBooksQuery,
  useGetWeatherQuery,
  useGetDjangoQuery,
  useAddReviewMutation,
  useGetAllStoriesQuery,
  useAddCompanyMutation,
  useGoogleAuthMutation,
  useGetReviewsQuery,
  useAddFeedbackMutation,
  useCreateStoryMutation,
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
