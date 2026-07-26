import { useMutation } from '@tanstack/react-query';
import api from '../../shared/lib/api';
import { ApiError, handleApiError, validateApiResponse } from '../../shared/lib/util';
import { buildMutationOptions } from '../../shared/services/query-client';
import { spaceKeys } from '../../shared/services/query-keys';
import { Space } from '../types';
import { SPACE_ENDPOINTS } from './space.endpoints';

export const useCreateSpaceMutation = () => {
  return useMutation<Space, ApiError, { name: string; icon: string }>(
    buildMutationOptions(spaceKeys.all, {
      mutationFn: async ({ name, icon }) => {
        try {
          const { data } = await api.post(SPACE_ENDPOINTS.create, { name, icon });
          return validateApiResponse<Space>(data);
        } catch (error) {
          throw handleApiError(error);
        }
      },
    })
  );
};

export const useUpdateSpaceMutation = () => {
  return useMutation<Space, ApiError, { id: number; name: string; icon: string }>(
    buildMutationOptions(spaceKeys.all, {
      mutationFn: async ({ id, name, icon }) => {
        try {
          const { data } = await api.patch(SPACE_ENDPOINTS.update(id), { name, icon });
          return validateApiResponse<Space>(data);
        } catch (error) {
          throw handleApiError(error);
        }
      },
    })
  );
};

export const useDeleteSpaceMutation = () => {
  return useMutation<void, ApiError, { id: number }>(
    buildMutationOptions(spaceKeys.all, {
      mutationFn: async ({ id }) => {
        try {
          const { data } = await api.delete(SPACE_ENDPOINTS.delete(id));
          validateApiResponse<void>(data);
        } catch (error) {
          throw handleApiError(error);
        }
      },
    })
  );
};
