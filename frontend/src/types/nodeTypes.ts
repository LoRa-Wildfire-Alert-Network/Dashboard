export type NodeData = {
  device_eui: string;
  node_id?: string;
  temperature_c: number;
  smoke_detected: boolean;
  humidity_pct: number;
  latitude: number;
  longitude: number;
  battery_level: number;
};
