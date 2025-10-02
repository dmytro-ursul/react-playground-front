import { createApi } from '@reduxjs/toolkit/query/react';
import {
  GET_PROJECTS,
  CREATE_PROJECT,
  UPDATE_PROJECT,
  REMOVE_PROJECT,
  CREATE_TASK,
  UPDATE_TASK,
  REMOVE_TASK,
  UPDATE_PROJECT_POSITION,
  UPDATE_TASK_POSITION
} from '../queries/projects';
import { SIGN_IN } from '../queries/auth';
import { graphqlRequestBaseQuery } from '@rtk-query/graphql-request-base-query';
import type { RootState } from '../../../store';
import AppSettings from '../../../settings';
import { setToken } from '../features/authSlice';

interface SignInResponse {
  signIn: {
    token: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

// Custom base query with JWT expiration handling
const baseQueryWithAuth = graphqlRequestBaseQuery({
  url: AppSettings.apiUrl as string,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;

    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }

    return headers;
  },
});

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQueryWithAuth(args, api, extraOptions);

  // Check if the error is due to JWT expiration
  if (result.error) {
    const errorMessage = result.error.message || '';

    // Handle JWT expiration errors
    if (errorMessage.includes('Signature has expired') ||
        errorMessage.includes('jwt expired') ||
        errorMessage.includes('token expired') ||
        (result.error as any)?.status === 500) {

      // Clear the expired token
      api.dispatch(setToken(null));

      // Optionally, you could try to refresh the token here
      // For now, we'll just clear it and force re-login
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Project'],
  endpoints: (builder) => ({
    login: builder.mutation<SignInResponse, { username: string; password: string }>({
      query: ({ username, password }: { username: string; password: string }) => ({
        document: SIGN_IN,
        variables: { username, password },
      }),
      invalidatesTags: ['Project']
    }),
    getProjects: builder.query({
      query: () => ({
        document: GET_PROJECTS,
      }),
      providesTags: ['Project'],
    }),
    createProject: builder.mutation({
      query: (name: string) => ({
        document: CREATE_PROJECT,
        variables: { name },
      }),
      invalidatesTags: ['Project'],
    }),
    updateProject: builder.mutation({
      query: ({ id, name }: { id: number; name: string }) => ({
        document: UPDATE_PROJECT,
        variables: { id, name },
      }),
      invalidatesTags: ['Project'],
    }),
    removeProject: builder.mutation({
      query: (id: number) => ({
        document: REMOVE_PROJECT,
        variables: {id},
      }),
      invalidatesTags: ['Project'],
    }),
    createTask: builder.mutation({
      query: ({ name, projectId, dueDate }: { name: string; projectId: number; dueDate?: string | null }) => ({
        document: CREATE_TASK,
        variables: { name, projectId, dueDate },
      }),
      invalidatesTags: ['Project'],
    }),
    updateTask: builder.mutation({
      query: ({id, name, projectId, completed, dueDate}: {id: number; name: string; projectId: number, completed: boolean, dueDate?: string | null}) => ({
        document: UPDATE_TASK,
        variables: {id, name, projectId, completed, dueDate},
      }),
      invalidatesTags: ['Project'],
    }),
    removeTask: builder.mutation({
      query: (id: number) => ({
        document: REMOVE_TASK,
        variables: {id},
      }),
      invalidatesTags: ['Project'],
    }),
    updateProjectPosition: builder.mutation({
      query: ({ id, position }: { id: string; position: number }) => ({
        document: UPDATE_PROJECT_POSITION,
        variables: { id, position },
      }),
      invalidatesTags: ['Project'],
    }),
    updateTaskPosition: builder.mutation({
      query: ({ id, position }: { id: string; position: number }) => ({
        document: UPDATE_TASK_POSITION,
        variables: { id, position },
      }),
      invalidatesTags: ['Project'],
    }),
  }),
});

export const {
  useLoginMutation,
  useGetProjectsQuery,
  useRemoveProjectMutation,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useRemoveTaskMutation,
  useUpdateProjectPositionMutation,
  useUpdateTaskPositionMutation,
} = apiSlice;
