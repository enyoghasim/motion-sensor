import { useQuery } from '@tanstack/react-query';
import api from '../../shared/lib/api';
import { ApiResponse } from '../../shared/types/api';
import { userKeys } from '../../shared/services/query-keys';
import { User } from '../types';
import { USER_ENDPOINTS } from './auth.endpoints';
import { getAccessToken } from './auth-storage';

export const useCurrentUserQuery = () => {
  return useQuery({
    queryKey: userKeys.detail('me'),
    queryFn: async () => {
      if (!getAccessToken()) return null;

      try {
        const { data } = await api.get<ApiResponse<User>>(USER_ENDPOINTS.me);
        return data.data ?? null;
      } catch {
        return null;
      }
    },
    retry: false,
  });
};
