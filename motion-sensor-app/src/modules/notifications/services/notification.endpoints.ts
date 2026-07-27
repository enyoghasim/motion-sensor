export const NOTIFICATION_ENDPOINTS = {
  list: '/api/notifications',
  unreadSummary: '/api/notifications/unread-summary',
  markRead: (id: number) => `/api/notifications/${id}/read`,
  markAllRead: '/api/notifications/read-all',
} as const;
