const LIVE_API_URL = "/api/live";

interface LiveApiResponse {
  devAddr?: string;
  time?: string;
  rxInfo?: Array<{
    gatewayId?: string;
    rssi?: number;
    snr?: number;
    location?: {
      latitude?: number;
      longitude?: number;
      altitude?: number;
    };
  }>;
  deviceInfo?: {
    devEui?: string;
  };
  object?: {
    battery_level?: number;
    humidity?: number;
    smoke_detected?: boolean;
    temperature?: number;
    timestamp?: number;
  };
}

export interface TelemetryData {
  node_id: string;
  device_eui?: string;
  gateway_id?: string;
  timestamp: string;
  device_timestamp?: string;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  temperature_c?: number;
  humidity_pct?: number;
  battery_level?: number;
  rssi?: number;
  snr?: number;
  node_name?: string;
}

function parseRfc3339(dtStr: string | undefined): string | undefined {
  if (!dtStr) return undefined;
  return new Date(dtStr.replace("Z", "+00:00")).toISOString();
}

function parseUnixEpoch(ts: number | undefined): string | undefined {
  if (!ts) return undefined;
  try {
    return new Date(ts * 1000).toISOString();
  } catch {
    return undefined;
  }
}

function extractTelemetry(objs: LiveApiResponse[]): TelemetryData[] {
  const rows: TelemetryData[] = [];
  
  for (const o of objs) {
    const nodeId = o.devAddr;
    if (!nodeId) continue;

    const tsNetwork = parseRfc3339(o.time);
    const rx = o.rxInfo || [];
    const rx0 = rx[0] || {};
    const gatewayId = rx0.gatewayId;
    const rssi = rx0.rssi;
    const snr = rx0.snr;
    const loc = rx0.location || {};
    const lat = loc.latitude;
    const lon = loc.longitude;
    const alt = loc.altitude;

    const obj = o.object || {};
    const batteryLevel = obj.battery_level;
    const humidity = obj.humidity;
    const tempRaw = obj.temperature;
    const temperatureC = tempRaw !== undefined ? tempRaw / 100.0 : undefined;
    const tsDevice = parseUnixEpoch(obj.timestamp);

    rows.push({
      node_id: nodeId,
      device_eui: o.deviceInfo?.devEui,
      gateway_id: gatewayId,
      timestamp: tsNetwork || new Date().toISOString(),
      device_timestamp: tsDevice,
      latitude: lat,
      longitude: lon,
      altitude: alt,
      temperature_c: temperatureC,
      humidity_pct: humidity,
      battery_level: batteryLevel,
      rssi: rssi,
      snr: snr,
    });
  }
  
  return rows;
}

export async function fetchLiveTelemetry(): Promise<TelemetryData[]> {
  try {
    const response = await fetch(LIVE_API_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const objs = Array.isArray(data) ? data : [data];
    return extractTelemetry(objs);
  } catch (error) {
    console.error("Failed to fetch live telemetry:", error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error("Network error: Unable to reach the API. Check CORS settings or network connection.");
    }
    throw error;
  }
}

