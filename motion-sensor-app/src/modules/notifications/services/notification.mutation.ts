import { useMutation } from '@tanstack/react-query';
import api from '../../shared/lib/api';
import { ApiError, handleApiError, validateApiResponse } from '../../shared/lib/util';
import { buildMutationOptions } from '../../shared/services/query-client';
import { notificationKeys } from '../../shared/services/query-keys';
import { Notification } from '../types';
import { NOTIFICATION_ENDPOINTS } from './notification.endpoints';

export const useMarkNotificationReadMutation = () => {
  return useMutation<Notification, ApiError, number>(
    buildMutationOptions(notificationKeys.all, {
      mutationFn: async (id: number) => {
        try {
          const { data } = await api.patch(NOTIFICATION_ENDPOINTS.markRead(id));
          return validateApiResponse<Notification>(data);
        } catch (error) {
          throw handleApiError(error);
        }
      },
    })
  );
};

export const useMarkAllNotificationsReadMutation = () => {
  return useMutation<{ updated_count: number }, ApiError, void>(
    buildMutationOptions(notificationKeys.all, {
      mutationFn: async () => {
        try {
          const { data } = await api.post(NOTIFICATION_ENDPOINTS.markAllRead);
          return validateApiResponse<{ updated_count: number }>(data);
        } catch (error) {
          throw handleApiError(error);
        }
      },
    })
  );
};
