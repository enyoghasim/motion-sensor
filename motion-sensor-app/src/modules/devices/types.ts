export type Device = {
  id: string;
  factory_mac: string;
  name: string | null;
  status: string;
  space_id: number | null;
  created_at: string;
  last_seen: string | null;
};

export type DevicePaginatedResponse = {
  items: Device[];
  next_cursor: string | null;
};
