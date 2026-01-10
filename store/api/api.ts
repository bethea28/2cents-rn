import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { authTokenStore } from "@/app/customHooks";
import authSlice from "../authReducer";

/**
 * 🛡️ STAFF ENGINEER: SINGLE SOURCE OF TRUTH
 * Change this IP here, and it updates the whole app (including refresh logic).
 */
const ARENA_IP = "172.20.10.4";
// const BASE_URL = `http://${ARENA_IP}:3000`;
const BASE_URL = "https://unpredicting-raring-chaim.ngrok-free.dev";
export const objectToUrlEncodedString = (obj: Record<string, string | number>) => {
  // @ts-ignore
  const urlEncoded = new URLSearchParams(obj);
  return urlEncoded.toString();
};

const createMyBaseQuery = () => {
  return async (args, api, extraOptions) => {
    // 1. Setup the main fetch query
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

    // 2. Execute the initial request
    let result = await rawBaseQuery(args, api, extraOptions);
    const dispatch = api.dispatch;

    // 3. Handle Token Refresh (401 Unauthorized)
    if (result?.error?.status === 401) {
      const refreshToken = await authTokenStore.getRefreshToken();

      if (refreshToken) {
        try {
          // 🛡️ STAFF ENGINEER: Using BASE_URL constant to avoid IP mismatches
          const refreshResult = await fetch(`${BASE_URL}/auth/refresh`, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: objectToUrlEncodedString({ refreshToken }),
          });

          if (refreshResult.ok) {
            const newTokens = await refreshResult.json();
            await authTokenStore.storeTokens(
              newTokens.accessToken,
              newTokens.refreshToken
            );
            dispatch(authSlice.actions.setAccessToken(newTokens));

            // Retry the original request with the new token
            result = await rawBaseQuery(args, api, extraOptions);
          } else {
            // Refresh failed - clean up
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
  tagTypes: ["stories", "comments"],
  endpoints: (build) => ({
    // --- 🔐 AUTH ENDPOINTS ---
    authLogin: build.mutation<any, FormData>({
      query: (formData) => ({
        url: "/auth/login", // 🛡️ Added leading slash for safety
        method: "POST",
        body: formData,
      }),
    }),
    authRegister: build.mutation<any, FormData>({
      query: (formData) => ({
        url: "/auth/register",
        method: "POST",
        body: formData,
      }),
    }),

    // --- 🥊 STORY/ARENA ENDPOINTS ---
    getStoryById: build.query({
      query: (id) => ({
        url: `/stories/getStoryById/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'stories', id }],
    }),

    getAllPendingStories: build.query({
      query: (userId) => ({
        url: `/stories/${userId}/getAllPendingStories`,
        method: "GET",
      }),
      providesTags: (result, error, userId) => [
        { type: 'stories', id: 'LIST' },
        { type: 'stories', userId }
      ],
    }),

    getAllCompleteStories: build.query({
      // 🛡️ Pass 'userId' as an argument here
      query: (userId) => console.log('hey') || ({
        url: `/stories/getAllCompleteStories`,
        method: "GET",
        // 🛡️ 'params' automatically turns { userId: 123 } into ?userId=123
        params: userId ? { userId } : {},
      }),
      providesTags: ['stories'],
    }),

    createStory: build.mutation<any, FormData>({
      query: (formData) => ({
        url: "/stories/createStory",
        method: "POST",
        body: formData,
      }),
    }),

    acceptChallenge: build.mutation({
      query: (id) => ({
        url: `/stories/acceptChallenge/${id}`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'stories', id },
        { type: 'stories', id: 'LIST' },
        'stories'
      ],
    }),

    handleStoryRebuttal: build.mutation({
      query: ({ id, formData }) => ({
        url: `/stories/rebuttal/${id}`,
        method: "PATCH",
        body: formData,
      }),
      invalidatesTags: ['stories'],
    }),

    updateStoryStatus: build.mutation({
      query: ({ id, ...patch }) => console.log('test me update', id, patch) || ({
        url: `/stories/${id}`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'stories', id },
        'stories'
      ],
    }),

    // --- 🗳 VOTING ENDPOINTS ---
    castVote: build.mutation<any, { storyId: number; side: 'A' | 'B' }>({
      query: ({ storyId, side }) => ({
        url: `/votes/storiesVote/${storyId}`,
        method: "POST",
        body: { storyId, side },
      }),
      invalidatesTags: (result, error, { storyId }) => [
        { type: 'stories', id: storyId }
      ],
    }),

    // --- 💬 COMMENT ENDPOINTS ---
    getComments: build.query<any, { storyId: number; page?: number }>({
      query: ({ storyId, page = 1 }) => `/comments/${storyId}?page=${page}`,
      providesTags: (result, error, { storyId }) => [
        { type: 'comments', id: 'LIST' },
        { type: 'comments', id: storyId }
      ],
    }),

    postComment: build.mutation<any, { storyId: number; content: string; side: string; parentId?: number }>({
      query: ({ storyId, ...body }) => ({
        url: `/comments/${storyId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { storyId }) => [
        { type: 'comments', id: storyId }
      ],
    }),

    toggleCommentLike: build.mutation<any, { commentId: number }>({
      query: ({ commentId }) => ({
        url: `/likes/like/${commentId}`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'comments', id: 'LIST' }],
    }),

    // --- 🧪 EXPERIMENTAL/LEGACY ENDPOINTS ---
    getWeather: build.query<any, void>({
      queryFn: async () => {
        const req = await fetch("https://api.escuelajs.co/api/v1/products");
        const resp = await req.json();
        return { data: resp };
      },
    }),
  }),
  refetchOnMountOrArgChange: true,
});

export const {
  useGetStoryByIdQuery,
  useGetAllPendingStoriesQuery,
  useGetAllCompleteStoriesQuery,
  useGetCommentsQuery,
  useGetWeatherQuery,
  useAuthLoginMutation,
  useAuthRegisterMutation,
  useCreateStoryMutation,
  useUpdateStoryStatusMutation,
  useHandleStoryRebuttalMutation,
  useAcceptChallengeMutation,
  useCastVoteMutation,
  usePostCommentMutation,
  useToggleCommentLikeMutation
} = api;