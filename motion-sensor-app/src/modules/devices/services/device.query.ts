import { useQuery } from '@tanstack/react-query';
import api from '../../shared/lib/api';
import { deviceKeys } from '../../shared/services/query-keys';
import { DevicePaginatedResponse } from '../types';
import { DEVICE_ENDPOINTS } from './device.endpoints';

export const useDevicesQuery = () => {
  return useQuery({
    queryKey: deviceKeys.list({}),
    queryFn: async () => {
      const { data } = await api.get<DevicePaginatedResponse>(DEVICE_ENDPOINTS.list, {
        params: { limit: 50 },
      });
      return data;
    },
  });
};
