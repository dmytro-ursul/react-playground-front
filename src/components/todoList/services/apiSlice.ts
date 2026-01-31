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
import { 
  SIGN_IN, 
  VERIFY_TWO_FACTOR, 
  SETUP_TWO_FACTOR, 
  ENABLE_TWO_FACTOR, 
  DISABLE_TWO_FACTOR,
  GET_CURRENT_USER 
} from '../queries/auth';
import { graphqlRequestBaseQuery } from '@rtk-query/graphql-request-base-query';
import type { RootState } from '../../../store';
import AppSettings from '../../../settings';
import { setToken } from '../features/authSlice';

interface SignInResponse {
  signIn: {
    token: string | null;
    user: {
      firstName: string;
      lastName: string;
      otpEnabled: boolean;
    } | null;
    requiresTwoFactor: boolean;
    tempToken: string | null;
  };
}

interface VerifyTwoFactorResponse {
  verifyTwoFactor: {
    token: string;
    user: {
      firstName: string;
      lastName: string;
      otpEnabled: boolean;
    };
  };
}

interface SetupTwoFactorResponse {
  setupTwoFactor: {
    secret: string;
    provisioningUri: string;
    qrCodeSvg: string;
  };
}

interface EnableTwoFactorResponse {
  enableTwoFactor: {
    success: boolean;
    message: string;
  };
}

interface DisableTwoFactorResponse {
  disableTwoFactor: {
    success: boolean;
    message: string;
  };
}

interface CurrentUserResponse {
  currentUser: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    otpEnabled: boolean;
  } | null;
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

  // Check if the error is due to JWT expiration or authorization failure
  if (result.error) {
    const errorMessage = (result.error as any).message || '';
    const status = (result.error as any).status;
    
    // Check GraphQL error data structure for authorization errors
    const graphqlErrors = (result.error as any)?.data?.errors;
    const hasUnauthorizedError = graphqlErrors?.some((err: any) => 
      err?.message?.includes('Unauthorized')
    );

    // Handle JWT expiration errors (401 or specific messages)
    if (status === 401 ||
        hasUnauthorizedError ||
        errorMessage.includes('Signature has expired') ||
        errorMessage.includes('jwt expired') ||
        errorMessage.includes('token expired') ||
        errorMessage.includes('Token has expired') ||
        errorMessage.includes('Invalid token')) {

      // Clear the expired token
      api.dispatch(setToken(null));
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Project', 'User'],
  endpoints: (builder) => ({
    login: builder.mutation<SignInResponse, { username: string; password: string }>({
      query: ({ username, password }: { username: string; password: string }) => ({
        document: SIGN_IN,
        variables: { username, password },
      }),
      invalidatesTags: ['Project']
    }),
    verifyTwoFactor: builder.mutation<VerifyTwoFactorResponse, { tempToken: string; code: string }>({
      query: ({ tempToken, code }) => ({
        document: VERIFY_TWO_FACTOR,
        variables: { tempToken, code },
      }),
      invalidatesTags: ['Project']
    }),
    setupTwoFactor: builder.mutation<SetupTwoFactorResponse, void>({
      query: () => ({
        document: SETUP_TWO_FACTOR,
      }),
    }),
    enableTwoFactor: builder.mutation<EnableTwoFactorResponse, { code: string }>({
      query: ({ code }) => ({
        document: ENABLE_TWO_FACTOR,
        variables: { code },
      }),
      invalidatesTags: ['User']
    }),
    disableTwoFactor: builder.mutation<DisableTwoFactorResponse, { password: string; code: string }>({
      query: ({ password, code }) => ({
        document: DISABLE_TWO_FACTOR,
        variables: { password, code },
      }),
      invalidatesTags: ['User']
    }),
    getCurrentUser: builder.query<CurrentUserResponse, void>({
      query: () => ({
        document: GET_CURRENT_USER,
      }),
      providesTags: ['User'],
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
  useVerifyTwoFactorMutation,
  useSetupTwoFactorMutation,
  useEnableTwoFactorMutation,
  useDisableTwoFactorMutation,
  useGetCurrentUserQuery,
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
