import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import AlertAckButton from "../Alerts/AlertAckButton";
import type {
  DetailNodeData,
  ShortNodeData,
  Alert,
} from "../../types/nodeTypes";
import ShowAckedButton from "../Alerts/ShowAckedButton";

const NodeDetails: React.FC<{
  nodeEui: string | null;
  showAcked: boolean;
  setShowAcked: (v: boolean) => void;
  userSubscriptions: string[];
}> = ({ nodeEui, showAcked, setShowAcked, userSubscriptions }) => {
  const [nodeData, setNodeData] = useState<DetailNodeData | null>(null);
  const [historicalData, setHistoricalData] = useState<ShortNodeData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [displayedAlerts, setDisplayedAlerts] = useState<Alert[]>([]);
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
        const token = await getToken();
        const response = await fetch(`${API_URL}/nodes/${nodeEui}/latest`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
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
        const token = await getToken();
        const response = await fetch(
          `${API_URL}/telemetry?device_eui=${nodeEui}&limit=50`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} },
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
        setAlerts(data);
      } catch (error) {
        console.error("Error fetching node alerts:", error);
      }
    };

    fetchCurrentNodeData();
    fetchHistoricalData();
    fetchNodeAlerts();
    const nodeDataInterval = setInterval(fetchCurrentNodeData, 3000);
    const alertsInterval = setInterval(fetchNodeAlerts, 3000);
    const historicalDataInterval = setInterval(fetchHistoricalData, 30000);
    return () => {
      clearInterval(nodeDataInterval);
      clearInterval(alertsInterval);
      clearInterval(historicalDataInterval);
    };
  }, [API_URL, getToken, nodeEui]);

  useEffect(() => {
    if (showAcked) {
      setDisplayedAlerts(alerts);
    } else {
      setDisplayedAlerts(alerts.filter((alert) => !alert.acknowledged));
    }
  }, [alerts, showAcked]);

  return (
    <div className="lg:w-90 md:w-84 bg-gray-800 rounded-md p-4 overflow-y-auto max-h-[60vh] md:max-h-none md:flex-1 border border-gray-700 text-gray-200">
      <h2 className="text-xl font-bold mb-4 text-white">
        Node EUI:{" "}
        <span className="text-amber-400">{nodeEui ?? "None Selected"}</span>
      </h2>
      {nodeEui && nodeData && (
        <div>
          <div>
            <h3 className="text-base font-semibold text-amber-400 uppercase tracking-wide mb-2">
              Current Readings
            </h3>
            <div className="ml-2 space-y-1 text-sm">
              <p>
                <span className="text-gray-400">Temperature:</span>{" "}
                {nodeData.temperature_c}°C
              </p>
              <p>
                <span className="text-gray-400">Humidity:</span>{" "}
                {nodeData.humidity_pct}%
              </p>
              <p>
                <span className="text-gray-400">Battery:</span>{" "}
                {nodeData.battery_level}%
              </p>
              <p>
                <span className="text-gray-400">Smoke:</span>{" "}
                {nodeData.smoke_detected ? (
                  <span className="text-red-400 font-semibold">Yes</span>
                ) : (
                  "No"
                )}
              </p>
              <p>
                <span className="text-gray-400">Latitude:</span>{" "}
                {nodeData.latitude}
              </p>
              <p>
                <span className="text-gray-400">Longitude:</span>{" "}
                {nodeData.longitude}
              </p>
              <p>
                <span className="text-gray-400">Altitude:</span>{" "}
                {nodeData.altitude}
              </p>
              <p>
                <span className="text-gray-400">RSSI:</span> {nodeData.rssi}
              </p>
              <p>
                <span className="text-gray-400">SNR:</span> {nodeData.snr}
              </p>
              <p>
                <span className="text-gray-400">Gateway:</span>{" "}
                {nodeData.gateway_id}
              </p>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mt-5 mb-2">
              <h3 className="text-base font-semibold text-amber-400 uppercase tracking-wide">
                Alerts
              </h3>
              <ShowAckedButton
                showAcked={showAcked}
                setShowAcked={setShowAcked}
              />
            </div>

            {displayedAlerts.length === 0 ? (
              <p className="ml-2 text-sm text-gray-500">
                No alerts to display. Check to see if you are subscribed to this
                node.
              </p>
            ) : (
              <ul className="space-y-2">
                {displayedAlerts.map((alert) => (
                  <li
                    key={alert.id}
                    className="border-l-4 border-l-amber-500 pl-3 pb-2 border-b border-gray-700"
                  >
                    <p className="font-semibold text-sm text-amber-300">
                      {alert.alert_type}
                      <span className="text-gray-500 font-normal ml-2">
                        [{new Date(alert.created_at * 1000).toLocaleString()}]
                      </span>
                    </p>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">
                      {alert.message}
                    </p>
                    {userSubscriptions.includes(alert.dev_eui) && (
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
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="text-base font-semibold text-amber-400 uppercase tracking-wide mt-5 mb-2">
              Historical Data (50)
            </h3>
            {historicalData.length === 0 ? (
              <p className="ml-2 text-sm text-gray-500">
                No historical data available.
              </p>
            ) : (
              <ul className="space-y-2">
                {historicalData.map((data, index) => (
                  <li
                    key={index}
                    className="border-b border-gray-700 pb-2 text-sm"
                  >
                    <p className="text-gray-400 font-medium">
                      {data.timestamp
                        ? new Date(data.timestamp).toLocaleString()
                        : "N/A"}
                    </p>
                    <p>
                      <span className="text-gray-400">Temp:</span>{" "}
                      {data.temperature_c}°C &nbsp;
                      <span className="text-gray-400">Humidity:</span>{" "}
                      {data.humidity_pct}% &nbsp;
                      <span className="text-gray-400">Battery:</span>{" "}
                      {data.battery_level}%
                    </p>
                    <p>
                      <span className="text-gray-400">Smoke:</span>{" "}
                      {data.smoke_detected ? (
                        <span className="text-red-400">Yes</span>
                      ) : (
                        "No"
                      )}
                    </p>
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
