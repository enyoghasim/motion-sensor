import { useQuery } from '@tanstack/react-query';
import api from '../../shared/lib/api';
import { notificationKeys } from '../../shared/services/query-keys';
import { ApiResponse } from '../../shared/types/api';
import { NotificationPaginatedResponse, NotificationUnreadSummary } from '../types';
import { NOTIFICATION_ENDPOINTS } from './notification.endpoints';

export const useNotificationsQuery = (enabled: boolean = true) => {
  return useQuery({
    queryKey: notificationKeys.list({ limit: 50 }),
    enabled,
    queryFn: async () => {
      const response = await api.get<ApiResponse<NotificationPaginatedResponse>>(
        NOTIFICATION_ENDPOINTS.list,
        { params: { limit: 50 } }
      );
      return response.data.data;
    },
  });
};

export const useNotificationUnreadCountQuery = (enabled: boolean = true) => {
  return useQuery({
    queryKey: notificationKeys.detail('unread-summary'),
    enabled,
    refetchInterval: 15000, // Poll every 15s to keep badge fresh
    queryFn: async () => {
      const response = await api.get<ApiResponse<NotificationUnreadSummary>>(
        NOTIFICATION_ENDPOINTS.unreadSummary
      );
      return response.data.data;
    },
  });
};
