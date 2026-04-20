export type ShortNodeData = {
  device_eui: string;
  node_id?: string;
  timestamp?: string;
  temperature_c: number;
  smoke_detected: boolean;
  humidity_pct: number;
  latitude: number;
  longitude: number;
  battery_level: number;
};

export type DetailNodeData = ShortNodeData & {
  gateway_id: string;
  timestamp: string;
  altitude: number;
  rssi: number;
  snr: number;
};

export type Alert = {
  id: number;
  dev_eui: string;
  alert_type: string;
  message: string;
  created_at: string;
  acknowledged: boolean;
  acknowledged_at?: number | null;
};
