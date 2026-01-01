import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { authTokenStore } from "@/app/customHooks";
import authSlice from "../authReducer";

// Helper for Legacy Form Data (Optional if using JSON)
export const objectToUrlEncodedString = (obj: Record<string, any>) => {
  const urlEncoded = new URLSearchParams(obj);
  return urlEncoded.toString();
};

const createMyBaseQuery = () => {
  return async (args: any, api: any, extraOptions: any) => {
    // 🛠 ENGINEER: Unified IP Address to avoid network errors
    const BASE_URL = "http://192.168.1.153:3000/";

    const rawBaseQuery = fetchBaseQuery({
      baseUrl: BASE_URL,
      prepareHeaders: async (headers) => {
        const accessToken = await authTokenStore.getAccessToken();
        if (accessToken) {
          headers.set("Authorization", `Bearer ${accessToken}`);
        }
        return headers;
      },
    });

    let result = await rawBaseQuery(args, api, extraOptions);
    const { dispatch } = api;

    // 🔄 Automatic Token Refresh Logic
    if (result?.error?.status === 401) {
      const refreshToken = await authTokenStore.getRefreshToken();
      if (refreshToken) {
        try {
          const refreshResult = await fetch(`${BASE_URL}auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: objectToUrlEncodedString({ refreshToken }),
          });

          if (refreshResult.ok) {
            const newTokens = await refreshResult.json();
            await authTokenStore.storeTokens(newTokens.accessToken, newTokens.refreshToken);
            dispatch(authSlice.actions.setAccessToken(newTokens));
            result = await rawBaseQuery(args, api, extraOptions); // Retry original call
          } else {
            dispatch(authSlice.actions.logout());
          }
        } catch (error) {
          dispatch(authSlice.actions.logout());
        }
      }
    }
    return result;
  };
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: createMyBaseQuery(),
  tagTypes: ["stories", "comments"],
  endpoints: (build) => ({

    // --- 🗳 VOTING ENDPOINTS ---
    castVote: build.mutation<any, { storyId: number; side: 'A' | 'B' }>({
      query: (voteData) => ({
        url: `votes/storiesVote/${voteData.storyId}`,
        method: "POST",
        body: voteData,
      }),
      // 🛠 ENGINEER: Invalidating the specific story ensures the "Score Meter" updates
      invalidatesTags: (result, error, { storyId }) => [{ type: 'stories', id: storyId }],
    }),

    // --- 💬 COMMENT ENDPOINTS ---
    getComments: build.query<any, { storyId: number; page?: number }>({
      query: ({ storyId, page = 1 }) => ({
        url: `comments/${storyId}?page=${page}`,
        method: "GET",
      }),
      providesTags: (result, error, { storyId }) => [{ type: 'comments', id: storyId }],
    }),

    postComment: build.mutation<any, { storyId: number; content: string; parentId?: number }>({
      query: ({ storyId, ...body }) => ({
        url: `comments/${storyId}`,
        method: "POST",
        body,
      }),
      // Refreshes the comment list for this story specifically
      invalidatesTags: (result, error, { storyId }) => [{ type: 'comments', id: storyId }],
    }),

    // --- 🎭 STORY ENDPOINTS ---
    getStoryById: build.query({
      query: (id) => `stories/getStoryById/${id}`,
      providesTags: (result, error, id) => [{ type: 'stories', id }],
    }),

    createStory: build.mutation<any, FormData>({
      query: (formData) => ({
        url: "stories/createStory",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["stories"],
    }),

    acceptChallenge: build.mutation({
      query: (id) => ({
        url: `stories/acceptChallenge/${id}`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'stories', id },
        'stories'
      ],
    }),

    getAllCompleteStories: build.query({
      query: () => "stories/getAllCompleteStories",
      providesTags: ["stories"],
    }),

    // --- 🔐 AUTH ENDPOINTS ---
    authLogin: build.mutation<any, any>({
      query: (data) => ({
        url: "auth/login",
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: objectToUrlEncodedString(data),
      }),
    }),
  }),
});

export const {
  useCastVoteMutation,
  useGetCommentsQuery,
  usePostCommentMutation,
  useGetStoryByIdQuery,
  useGetAllCompleteStoriesQuery,
  useCreateStoryMutation,
  useAcceptChallengeMutation,
  useAuthLoginMutation,
} = api;