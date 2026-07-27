export type Notification = {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
};

export type NotificationUnreadSummary = {
  unread_count: number;
  has_unread: boolean;
};

export type NotificationPaginatedResponse = {
  items: Notification[];
  next_cursor: string | null;
};
