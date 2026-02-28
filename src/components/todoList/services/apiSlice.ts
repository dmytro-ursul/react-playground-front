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
import { offlineStorage } from '../../../services/offlineStorage';
import { offlineSyncService } from '../../../services/offlineSyncService';

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
  const isOffline =
    typeof navigator !== 'undefined' ? !navigator.onLine : !offlineSyncService.getOnlineStatus();

  if (isOffline) {
    if (api.type === 'query' && args?.document === GET_PROJECTS) {
      const cachedProjects = await offlineStorage.getProjects();
      if (cachedProjects.length > 0) {
        return { data: { projects: cachedProjects } };
      }
      return { error: { status: 'OFFLINE', message: 'Offline and no cached data' } };
    }

    if (api.type === 'mutation') {
      const offlineMutationDocs = new Set([
        CREATE_PROJECT,
        UPDATE_PROJECT,
        REMOVE_PROJECT,
        CREATE_TASK,
        UPDATE_TASK,
        REMOVE_TASK,
        UPDATE_PROJECT_POSITION,
        UPDATE_TASK_POSITION,
      ]);

      if (offlineMutationDocs.has(args?.document)) {
        return { data: { offline: true } };
      }
    }
  }

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

  if (!result.error && api.type === 'query' && args?.document === GET_PROJECTS) {
    const projects = (result as any)?.data?.projects;
    if (Array.isArray(projects)) {
      await offlineStorage.saveProjects(projects);
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
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (Array.isArray((data as any)?.projects)) {
            await offlineStorage.saveProjects((data as any).projects);
          }
        } catch {
          // Ignore cache persistence failures
        }
      },
    }),
    createProject: builder.mutation({
      query: (name: string) => ({
        document: CREATE_PROJECT,
        variables: { name },
      }),
      invalidatesTags: (result: any) => (result?.offline ? [] : ['Project']),
      async onQueryStarted(name: string, { dispatch, getState, queryFulfilled }) {
        if (!offlineSyncService.getOnlineStatus()) {
          const tempId = -Date.now();
          const currentProjects = (apiSlice.endpoints.getProjects.select(undefined)(getState() as RootState)?.data as any)
            ?.projects || [];
          const position = currentProjects.reduce(
            (max: number, p: any) => Math.max(max, p.position ?? 0),
            0
          ) + 1;

          dispatch(
            apiSlice.util.updateQueryData('getProjects', undefined, (draft: any) => {
              draft.projects = draft.projects || [];
              draft.projects.push({
                id: tempId,
                name,
                position,
                tasks: [],
              });
            })
          );

          await offlineSyncService.queueMutation('createProject', {
            name,
            clientId: tempId,
            position,
          });

          const data = apiSlice.endpoints.getProjects.select(undefined)(getState() as RootState)?.data as any;
          if (data?.projects) {
            await offlineStorage.saveProjects(data.projects);
          }

          return;
        }

        try {
          await queryFulfilled;
        } catch {
          // no-op
        }
      },
    }),
    updateProject: builder.mutation({
      query: ({ id, name }: { id: number; name: string }) => ({
        document: UPDATE_PROJECT,
        variables: { id, name },
      }),
      invalidatesTags: (result: any) => (result?.offline ? [] : ['Project']),
      async onQueryStarted(
        { id, name }: { id: number; name: string },
        { dispatch, getState, queryFulfilled }
      ) {
        if (!offlineSyncService.getOnlineStatus()) {
          dispatch(
            apiSlice.util.updateQueryData('getProjects', undefined, (draft: any) => {
              const project = draft.projects?.find((p: any) => Number(p.id) === Number(id));
              if (project) {
                project.name = name;
              }
            })
          );

          await offlineSyncService.queueMutation('updateProject', { id, name });

          const data = apiSlice.endpoints.getProjects.select(undefined)(getState() as RootState)?.data as any;
          if (data?.projects) {
            await offlineStorage.saveProjects(data.projects);
          }

          return;
        }

        try {
          await queryFulfilled;
        } catch {
          // no-op
        }
      },
    }),
    removeProject: builder.mutation({
      query: (id: number) => ({
        document: REMOVE_PROJECT,
        variables: {id},
      }),
      invalidatesTags: (result: any) => (result?.offline ? [] : ['Project']),
      async onQueryStarted(id: number, { dispatch, getState, queryFulfilled }) {
        if (!offlineSyncService.getOnlineStatus()) {
          dispatch(
            apiSlice.util.updateQueryData('getProjects', undefined, (draft: any) => {
              draft.projects = (draft.projects || []).filter((p: any) => Number(p.id) !== Number(id));
            })
          );

          await offlineSyncService.queueMutation('removeProject', { id });

          const data = apiSlice.endpoints.getProjects.select(undefined)(getState() as RootState)?.data as any;
          if (data?.projects) {
            await offlineStorage.saveProjects(data.projects);
          }

          return;
        }

        try {
          await queryFulfilled;
        } catch {
          // no-op
        }
      },
    }),
    createTask: builder.mutation({
      query: ({ name, projectId, dueDate }: { name: string; projectId: number; dueDate?: string | null }) => ({
        document: CREATE_TASK,
        variables: { name, projectId, dueDate },
      }),
      invalidatesTags: (result: any) => (result?.offline ? [] : ['Project']),
      async onQueryStarted(
        { name, projectId, dueDate }: { name: string; projectId: number; dueDate?: string | null },
        { dispatch, getState, queryFulfilled }
      ) {
        if (!offlineSyncService.getOnlineStatus()) {
          const tempId = -Date.now();
          const currentProjects = (apiSlice.endpoints.getProjects.select(undefined)(getState() as RootState)?.data as any)
            ?.projects || [];
          const currentProject = currentProjects.find((p: any) => Number(p.id) === Number(projectId));
          const nextPosition =
            (currentProject?.tasks || []).reduce((max: number, t: any) => Math.max(max, t.position ?? 0), 0) + 1;

          dispatch(
            apiSlice.util.updateQueryData('getProjects', undefined, (draft: any) => {
              const project = draft.projects?.find((p: any) => Number(p.id) === Number(projectId));
              if (!project) {
                return;
              }

              project.tasks = project.tasks || [];
              project.tasks.push({
                id: tempId,
                name,
                completed: false,
                position: nextPosition,
                projectId,
                dueDate: dueDate || null,
              });
            })
          );

          await offlineSyncService.queueMutation('createTask', {
            name,
            projectId,
            dueDate: dueDate || null,
            clientId: tempId,
            completed: false,
            position: nextPosition || 1,
          });

          const data = apiSlice.endpoints.getProjects.select(undefined)(getState() as RootState)?.data as any;
          if (data?.projects) {
            await offlineStorage.saveProjects(data.projects);
          }

          return;
        }

        try {
          await queryFulfilled;
        } catch {
          // no-op
        }
      },
    }),
    updateTask: builder.mutation({
      query: ({id, name, projectId, completed, dueDate}: {id: number; name: string; projectId: number, completed: boolean, dueDate?: string | null}) => ({
        document: UPDATE_TASK,
        variables: {id, name, projectId, completed, dueDate},
      }),
      invalidatesTags: (result: any) => (result?.offline ? [] : ['Project']),
      async onQueryStarted(
        { id, name, projectId, completed, dueDate }: { id: number; name: string; projectId: number; completed: boolean; dueDate?: string | null },
        { dispatch, getState, queryFulfilled }
      ) {
        const patchResult = dispatch(
          apiSlice.util.updateQueryData('getProjects', undefined, (draft: any) => {
            const projects = draft.projects || [];
            const currentProject = projects.find((p: any) =>
              (p.tasks || []).some((t: any) => Number(t.id) === Number(id))
            );
            const targetProject = projects.find((p: any) => Number(p.id) === Number(projectId));

            if (currentProject && targetProject) {
              const taskIndex = (currentProject.tasks || []).findIndex((t: any) => Number(t.id) === Number(id));
              if (taskIndex >= 0) {
                const task = currentProject.tasks[taskIndex];
                const updatedTask = {
                  ...task,
                  name,
                  completed,
                  dueDate: dueDate ?? task.dueDate ?? null,
                  projectId,
                };

                if (currentProject !== targetProject) {
                  currentProject.tasks.splice(taskIndex, 1);
                  targetProject.tasks = targetProject.tasks || [];
                  targetProject.tasks.push(updatedTask);
                } else {
                  currentProject.tasks[taskIndex] = updatedTask;
                }
              }
            }
          })
        );

        if (!offlineSyncService.getOnlineStatus()) {
          await offlineSyncService.queueMutation('updateTask', {
            id,
            name,
            projectId,
            completed,
            dueDate: dueDate ?? null,
          });

          const data = apiSlice.endpoints.getProjects.select(undefined)(getState() as RootState)?.data as any;
          if (data?.projects) {
            await offlineStorage.saveProjects(data.projects);
          }

          return;
        }

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    removeTask: builder.mutation({
      query: (id: number) => ({
        document: REMOVE_TASK,
        variables: {id},
      }),
      invalidatesTags: (result: any) => (result?.offline ? [] : ['Project']),
      async onQueryStarted(id: number, { dispatch, getState, queryFulfilled }) {
        if (!offlineSyncService.getOnlineStatus()) {
          dispatch(
            apiSlice.util.updateQueryData('getProjects', undefined, (draft: any) => {
              (draft.projects || []).forEach((project: any) => {
                project.tasks = (project.tasks || []).filter((t: any) => Number(t.id) !== Number(id));
              });
            })
          );

          await offlineSyncService.queueMutation('removeTask', { id });

          const data = apiSlice.endpoints.getProjects.select(undefined)(getState() as RootState)?.data as any;
          if (data?.projects) {
            await offlineStorage.saveProjects(data.projects);
          }

          return;
        }

        try {
          await queryFulfilled;
        } catch {
          // no-op
        }
      },
    }),
    updateProjectPosition: builder.mutation({
      query: ({ id, position }: { id: string; position: number }) => ({
        document: UPDATE_PROJECT_POSITION,
        variables: { id, position },
      }),
      invalidatesTags: (result: any) => (result?.offline ? [] : ['Project']),
      async onQueryStarted(
        { id, position }: { id: string; position: number },
        { dispatch, getState, queryFulfilled }
      ) {
        if (!offlineSyncService.getOnlineStatus()) {
          dispatch(
            apiSlice.util.updateQueryData('getProjects', undefined, (draft: any) => {
              const project = (draft.projects || []).find((p: any) => String(p.id) === String(id));
              if (project) {
                project.position = position;
              }
            })
          );

          await offlineSyncService.queueMutation('updateProject', { id: Number(id), position });

          const data = apiSlice.endpoints.getProjects.select(undefined)(getState() as RootState)?.data as any;
          if (data?.projects) {
            await offlineStorage.saveProjects(data.projects);
          }

          return;
        }

        try {
          await queryFulfilled;
        } catch {
          // no-op
        }
      },
    }),
    updateTaskPosition: builder.mutation({
      query: ({ id, position }: { id: string; position: number }) => ({
        document: UPDATE_TASK_POSITION,
        variables: { id, position },
      }),
      invalidatesTags: (result: any) => (result?.offline ? [] : ['Project']),
      async onQueryStarted(
        { id, position }: { id: string; position: number },
        { dispatch, getState, queryFulfilled }
      ) {
        if (!offlineSyncService.getOnlineStatus()) {
          dispatch(
            apiSlice.util.updateQueryData('getProjects', undefined, (draft: any) => {
              (draft.projects || []).forEach((project: any) => {
                const task = (project.tasks || []).find((t: any) => String(t.id) === String(id));
                if (task) {
                  task.position = position;
                }
              });
            })
          );

          await offlineSyncService.queueMutation('updateTask', { id: Number(id), position });

          const data = apiSlice.endpoints.getProjects.select(undefined)(getState() as RootState)?.data as any;
          if (data?.projects) {
            await offlineStorage.saveProjects(data.projects);
          }

          return;
        }

        try {
          await queryFulfilled;
        } catch {
          // no-op
        }
      },
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

export const registerOfflineMutationExecutors = (store: { dispatch: any; getState: () => RootState }) => {
  const execute = async (document: any, variables: any) => {
    const result = await baseQueryWithReauth(
      { document, variables },
      { dispatch: store.dispatch, getState: store.getState, type: 'mutation' },
      {}
    );
    if ((result as any)?.error) {
      throw (result as any).error;
    }
    return (result as any).data;
  };

  offlineSyncService.registerMutationExecutor('createProject', async (mutation) => {
    const { clientId, position, ...vars } = mutation.payload || {};
    const data = await execute(CREATE_PROJECT, { name: vars.name });
    const realId = (data as any)?.createProject?.project?.id;
    if (realId && typeof position === 'number') {
      await execute(UPDATE_PROJECT_POSITION, { id: String(realId), position });
    }
    store.dispatch(apiSlice.util.invalidateTags(['Project']));
  });

  offlineSyncService.registerMutationExecutor('updateProject', async (mutation) => {
    const vars = mutation.payload || {};
    if (typeof vars.position === 'number') {
      await execute(UPDATE_PROJECT_POSITION, { id: String(vars.id), position: vars.position });
    } else {
      await execute(UPDATE_PROJECT, { id: vars.id, name: vars.name });
    }
    store.dispatch(apiSlice.util.invalidateTags(['Project']));
  });

  offlineSyncService.registerMutationExecutor('removeProject', async (mutation) => {
    const vars = mutation.payload || {};
    await execute(REMOVE_PROJECT, { id: vars.id });
    store.dispatch(apiSlice.util.invalidateTags(['Project']));
  });

  offlineSyncService.registerMutationExecutor('createTask', async (mutation) => {
    const { clientId, completed, position, ...vars } = mutation.payload || {};
    const data = await execute(CREATE_TASK, {
      name: vars.name,
      projectId: vars.projectId,
      dueDate: vars.dueDate ?? null,
    });
    const realId = (data as any)?.createTask?.task?.id;
    if (realId && typeof position === 'number') {
      await execute(UPDATE_TASK_POSITION, { id: String(realId), position });
    }
    if (realId && completed === true) {
      await execute(UPDATE_TASK, {
        id: Number(realId),
        name: vars.name,
        projectId: vars.projectId,
        completed: true,
        dueDate: vars.dueDate ?? null,
      });
    }
    store.dispatch(apiSlice.util.invalidateTags(['Project']));
  });

  offlineSyncService.registerMutationExecutor('updateTask', async (mutation) => {
    const vars = mutation.payload || {};
    if (typeof vars.position === 'number') {
      await execute(UPDATE_TASK_POSITION, { id: String(vars.id), position: vars.position });
    } else {
      await execute(UPDATE_TASK, {
        id: vars.id,
        name: vars.name,
        projectId: vars.projectId,
        completed: vars.completed,
        dueDate: vars.dueDate ?? null,
      });
    }
    store.dispatch(apiSlice.util.invalidateTags(['Project']));
  });

  offlineSyncService.registerMutationExecutor('removeTask', async (mutation) => {
    const vars = mutation.payload || {};
    await execute(REMOVE_TASK, { id: vars.id });
    store.dispatch(apiSlice.util.invalidateTags(['Project']));
  });
};
