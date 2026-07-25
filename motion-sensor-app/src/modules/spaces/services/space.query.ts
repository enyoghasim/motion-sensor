import { useQuery } from '@tanstack/react-query';
import api from '../../shared/lib/api';
import { ApiResponse } from '../../shared/types/api';
import { spaceKeys } from '../../shared/services/query-keys';
import { Space } from '../types';
import { SPACE_ENDPOINTS } from './space.endpoints';

export const useSpacesQuery = (
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: spaceKeys.list({}),
    enabled,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Space[]>>(SPACE_ENDPOINTS.list);
      return data.data ?? [];
    },
  });
};
