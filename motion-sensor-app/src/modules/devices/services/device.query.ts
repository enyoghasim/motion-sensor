import { useQuery } from '@tanstack/react-query';
import api from '../../shared/lib/api';
import { deviceKeys } from '../../shared/services/query-keys';
import { DevicePaginatedResponse } from '../types';
import { DEVICE_ENDPOINTS } from './device.endpoints';

export const useGetSpaceDevices = (spaceId: number | null, enabled: boolean = true) => {
  return useQuery({
    queryKey: deviceKeys.list({ spaceId }),
    enabled: enabled && spaceId != null,
    queryFn: async () => {
      const { data } = await api.get<DevicePaginatedResponse>(DEVICE_ENDPOINTS.list, {
        params: { space_id: spaceId, limit: 50 },
      });
      return data;
    },
  });
};
