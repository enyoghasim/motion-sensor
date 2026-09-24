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

// A device found over Bluetooth before it has been paired — not yet a full `Device`.
export type DiscoveredDevice = {
  id: string;
  name: string;
  mac: string;
};

// A WiFi network found by the device's own scan, relayed over BLE (see
// WIFI_SCAN_CHAR_UUID) so the picker works identically on iOS and Android --
// neither platform lets an app scan for nearby networks from the phone side.
export type WifiNetwork = {
  ssid: string;
  rssi: number;
  secure: boolean;
};
