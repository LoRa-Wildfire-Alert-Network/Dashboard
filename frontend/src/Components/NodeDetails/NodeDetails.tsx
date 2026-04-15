import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import AlertAckButton from "../Alerts/AlertAckButton";
import type {
  DetailNodeData,
  ShortNodeData,
  Alert,
} from "../../types/nodeTypes";

const NodeDetails: React.FC<{ nodeEui: string | null }> = ({ nodeEui }) => {
  const [nodeData, setNodeData] = useState<DetailNodeData | null>(null);
  const [historicalData, setHistoricalData] = useState<ShortNodeData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const { getToken } = useAuth();

  const API_URL: string =
    import.meta.env.VITE_API_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchCurrentNodeData = async () => {
      if (!nodeEui) {
        setNodeData(null);
        return;
      }
      try {
        const response = await fetch(`${API_URL}/nodes/${nodeEui}/latest`);
        const data = await response.json();
        setNodeData(data);
      } catch (error) {
        console.error("Error fetching node data:", error);
      }
    };

    const fetchHistoricalData = async () => {
      if (!nodeEui) {
        setHistoricalData([]);
        return;
      }
      try {
        const response = await fetch(
          `${API_URL}/telemetry?device_eui=${nodeEui}&limit=50`,
        );
        const data = await response.json();
        setHistoricalData(data);
      } catch (error) {
        console.error("Error fetching historical data:", error);
      }
    };

    const fetchNodeAlerts = async () => {
      if (!nodeEui) {
        setAlerts([]);
        return;
      }
      try {
        const token = await getToken();
        const response = await fetch(`${API_URL}/alerts?dev_eui=${nodeEui}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        console.log("Fetched alerts:", data);
        setAlerts(data);
      } catch (error) {
        console.error("Error fetching node alerts:", error);
      }
    };

    fetchCurrentNodeData();
    fetchHistoricalData();
    fetchNodeAlerts();
    const interval = setInterval(fetchCurrentNodeData, 3000);
    return () => clearInterval(interval);
  }, [API_URL, getToken, nodeEui]);

  return (
    <div className="flex-1 max-h-[30vh] md:max-h-full md:h-full lg:w-90 md:w-48 bg-slate-100 rounded-md p-4 overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">
        Node EUI: {nodeEui ? nodeEui : "None Selected"}
      </h2>
      {nodeEui && nodeData && (
        <div>
          <div>
            <h3 className="text-lg font-bold">Current Readings:</h3>
            <div className="ml-4">
              <p> Temperature: {nodeData.temperature_c}°C</p>
              <p> Humidity: {nodeData.humidity_pct}%</p>
              <p> Battery Level: {nodeData.battery_level}%</p>
              <p> Smoke Detected: {nodeData.smoke_detected ? "Yes" : "No"}</p>
              <p> Latitude: {nodeData.latitude}</p>
              <p> Longitude: {nodeData.longitude}</p>
              <p> Altitude: {nodeData.altitude}</p>
              <p> RSSI: {nodeData.rssi}</p>
              <p> SNR: {nodeData.snr}</p>
              <p> Gateway ID: {nodeData.gateway_id}</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold mt-4">Alerts:</h3>
            {alerts.length === 0 ? (
              <p className="ml-4">Subscribe to this node to receive alerts.</p>
            ) : (
              <ul className="ml-4">
                {alerts.map((alert) => (
                  <li key={alert.id} className="mb-2">
                    <p className="font-semibold">
                      [{new Date(alert.created_at).toLocaleString()}]{" "}
                      {alert.alert_type}
                    </p>
                    <p> {alert.message}</p>
                    <AlertAckButton
                      alertId={alert.id}
                      acknowledged={alert.acknowledged}
                      onAckChange={(acknowledged) => {
                        setAlerts((prevAlerts) =>
                          prevAlerts.map((a) =>
                            a.id === alert.id ? { ...a, acknowledged } : a,
                          ),
                        );
                      }}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold mt-4">Historical Data (50):</h3>
            {historicalData.length === 0 ? (
              <p className="ml-4">No historical data available.</p>
            ) : (
              <ul className="ml-4">
                {historicalData.map((data, index) => (
                  <li key={index} className="mb-2">
                    <p className="font-semibold">
                      Timestamp:{" "}
                      {data.timestamp
                        ? new Date(data.timestamp).toLocaleString()
                        : "N/A"}
                    </p>
                    <p> Temperature: {data.temperature_c}°C</p>
                    <p> Humidity: {data.humidity_pct}%</p>
                    <p> Battery Level: {data.battery_level}%</p>
                    <p> Smoke Detected: {data.smoke_detected ? "Yes" : "No"}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NodeDetails;
