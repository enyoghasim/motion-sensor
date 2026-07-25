import { useMutation } from '@tanstack/react-query';
import api from '../../shared/lib/api';
import { ApiError, handleApiError, validateApiResponse } from '../../shared/lib/util';
import { buildMutationOptions } from '../../shared/services/query-client';
import { spaceKeys } from '../../shared/services/query-keys';
import { Space } from '../types';
import { SPACE_ENDPOINTS } from './space.endpoints';

export const useCreateSpaceMutation = () => {
  return useMutation<Space, ApiError, string>(
    buildMutationOptions(spaceKeys.all, {
      mutationFn: async (name: string) => {
        try {
          const { data } = await api.post(SPACE_ENDPOINTS.create, { name });
          return validateApiResponse<Space>(data);
        } catch (error) {
          throw handleApiError(error);
        }
      },
    })
  );
};
