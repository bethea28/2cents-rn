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
      // baseUrl: "http://10.99.69.39:3000/",    // cuperaco cafe  
      baseUrl: "http://192.168.1.153:3000/",
      // baseUrl: "http://172.20.10.4:3000/", //hotspot iphone
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
  }
};
export const api = createApi({
  reducerPath: "api",
  baseQuery: createMyBaseQuery(),
  tagTypes: [
    "stories", 'comments'
  ], endpoints: (build) => ({
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
      // providesTags: ['stories'],
    }),
    // --- 🗳 VOTING ENDPOINTS ---
    // api.ts
    castVote: build.mutation<any, { storyId: number; side: 'A' | 'B' }>({
      query: ({ storyId, side }) => ({
        url: `votes/storiesVote/${storyId}`,
        method: "POST",
        body: { storyId, side }, // 🛠 ADD storyId HERE - Your controller needs it in req.body!
      }),
      invalidatesTags: (result, error, { storyId }) => [
        { type: 'stories', id: storyId }
      ],
    }),


    // --- 💬 COMMENT ENDPOINTS ---

    getComments: build.query<any, { storyId: number; page?: number }>({
      query: ({ storyId, page = 1 }) => `comments/${storyId}?page=${page}`,
      providesTags: (result, error, { storyId }) => [
        { type: 'comments', id: 'LIST' }, // 🛠 This allows us to refresh ALL comment lists
        { type: 'comments', id: storyId } // 🛠 This allows us to refresh this SPECIFIC story's comments
      ],
    }),
    // Inside your api.js (Redux Toolkit Query)

    toggleCommentLike: build.mutation<any, { commentId: number }>({
      query: ({ commentId }) => ({
        url: `likes/like/${commentId}`,
        method: 'POST',
      }),
      // 🛠 ENGINEER: This now matches the 'LIST' tag in getComments
      invalidatesTags: [{ type: 'comments', id: 'LIST' }],
    }),
    // Update your mutation signature to include 'side'
    postComment: build.mutation<any, { storyId: number; content: string; side: string; parentId?: number }>({
      query: ({ storyId, ...body }) => ({
        url: `comments/${storyId}`,
        method: "POST",
        body, // This now sends content, side, and optionally parentId
      }),
      invalidatesTags: (result, error, { storyId }) => [
        { type: 'comments', id: storyId }
      ],
    }),
    updateStoryStatus: build.mutation({
      query: ({ id, ...patch }) => console.log('updating mutation', patch, id) || ({
        url: `stories/${id}`,
        method: "PATCH",
        body: patch,
      }),
      // 🛠 ENGINEER: Targeting the specific ID ensures the Details Screen 
      // "hears" the update and flips the UI state immediately.
      invalidatesTags: (result, error, { id }) => [
        { type: 'stories', id },
        'stories' // We still invalidate the list so the Inbox stays fresh
      ],
    }),
    handleStoryRebuttal: build.mutation({
      query: ({ id, formData }) => console.log('handel rebuttal story', formData) || ({
        url: `stories/rebuttal/${id}`, // Targeting the specific beef by ID
        method: "PATCH",      // PATCH is industry standard for partial updates
        body: formData,          // Sending { sideBAcknowledged: true }
      }),
      // This tells RTK Query the 'Stories' list is now old data, so go fetch the fresh version
      invalidatesTags: ['stories'],
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

    acceptChallenge: build.mutation({
      query: (id) => ({
        url: `stories/acceptChallenge/${id}`,
        method: "PATCH",
      }),

      // 🛠 ENGINEER: You need BOTH tags to update the current screen AND the list
      invalidatesTags: (result, error, id) => [
        { type: 'stories', id },       // 👈 THIS flips the button on your current screen
        { type: 'stories', id: 'LIST' }, // This refreshes the whole Challenges list
        'stories'                      // Inclusion of the string tag for safety
      ],
    }),

    getStoryById: build.query({
      query: (id) => ({
        url: `stories/getStoryById/${id}`,
        method: 'GET',
      }),
      // 3. This tags the data so the mutation knows what to refresh
      providesTags: (result, error, id) => [{ type: 'stories', id }],
    }),

    getAllPendingStories: build.query({
      query: (userId) => ({
        url: `stories/${userId}/getAllPendingStories`,
        method: "GET",
      }),
      // 🛠 ENGINEER: This ensures the list is linked to the user and the 'stories' type
      providesTags: (result, error, userId) => [
        { type: 'stories', id: 'LIST' },
        { type: 'stories', userId }
      ],
    }),
    // ... (rest of your endpoints)
    getAllCompleteStories: build.query({
      query: () => {
        console.log("Fetching pending stories for User ID:");
        return {
          url: `stories/getAllCompleteStories`, // Match your backend route path
          method: "GET",
        };
      },
      // Provides a tag so we can 'invalidate' this cache later 
      // (e.g., after Dan records his rebuttal, the list should refresh)
      providesTags: ['stories'],
    }),
    // ... (rest of your endpoints)
  }),
  refetchOnMountOrArgChange: true,
});

export const {
  useGetStoryByIdQuery,
  useGetAllPendingStoriesQuery,
  useGetAllCompleteStoriesQuery,
  useGetBooksQuery,
  useGetCommentsQuery,
  useGetWeatherQuery,
  useGetDjangoQuery,
  useGetReviewsQuery,
  useAddReviewMutation,
  useAddCompanyMutation,
  useGoogleAuthMutation,
  useAuthLoginMutation,
  useAddFeedbackMutation,
  useCreateStoryMutation,
  useUpdateStoryStatusMutation,
  useHandleStoryRebuttalMutation,
  useAcceptChallengeMutation,
  useCastVoteMutation,
  usePostCommentMutation,
  useToggleCommentLikeMutation
} = api;
