import { useState, useEffect } from "react";
import type { DetailNodeData, ShortNodeData } from "../../types/nodeTypes";

const NodeDetails: React.FC<{ nodeEui: string | null }> = ({ nodeEui }) => {
  const [nodeData, setNodeData] = useState<DetailNodeData | null>(null);
  const [historicalData, setHistoricalData] = useState<ShortNodeData[]>([]);

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
          `${API_URL}/telemetry?node_id=${nodeEui}&limit=50`,
        );
        const data = await response.json();
        console.log("Historical data:", data);
        setHistoricalData(data);
      } catch (error) {
        console.error("Error fetching historical data:", error);
      }
    };

    fetchCurrentNodeData();
    fetchHistoricalData();
    const interval = setInterval(fetchCurrentNodeData, 3000);
    return () => clearInterval(interval);
  }, [API_URL, nodeEui]);
  return (
    <div className="flex-none lg:w-90 md:w-48 bg-slate-100 rounded-md p-4 overflow-y-auto">
      <h2 className="text-2xl font-bold mb-4">Node EUI: {nodeEui}</h2>
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
