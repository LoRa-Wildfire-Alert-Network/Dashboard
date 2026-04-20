import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import type { ShortNodeData, Alert } from "./../../types/nodeTypes";
import WildfireMap from "../WildfireMap/WildfireMap";
import NodeDetails from "../NodeDetails/NodeDetails";
import NodeListPanel from "../NodeListPanel/NodeListPanel";
import { useAuthContext } from "../../providers/AuthContext";
import ShowAckedButton from "../Alerts/ShowAckedButton";
import type { NodeFilterState } from "../NodeFilter/NodeFilter";
import AlertAckButton from "../Alerts/AlertAckButton";

const Dashboard: React.FC = () => {
  const [nodeData, setNodeData] = useState<ShortNodeData[]>([]);
  const [userSubscriptions, setUserSubscriptions] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showAcked, setShowAcked] = useState<boolean>(false);
  const [displayedAlerts, setDisplayedAlerts] = useState<Alert[]>([]);
  const [filterState, setFilterState] = useState<NodeFilterState>({});

  const filteredNodeData = useMemo(() => {
    let nodes = [...nodeData];
    if (filterState.onlySubscribed) {
      nodes = nodes.filter((n) => userSubscriptions.includes(n.device_eui));
    }
    if (filterState.smokeDetected) {
      nodes = nodes.filter((n) => n.smoke_detected);
    }
    if (filterState.tempAbove !== undefined) {
      nodes = nodes.filter((n) => n.temperature_c > filterState.tempAbove!);
    }
    if (filterState.humidityBelow !== undefined) {
      nodes = nodes.filter((n) => n.humidity_pct < filterState.humidityBelow!);
    }
    if (filterState.lowBattery) {
      nodes = nodes.filter((n) => n.battery_level < 20);
    }
    return nodes;
  }, [nodeData, userSubscriptions, filterState]);

  const API_URL: string =
    import.meta.env.VITE_API_URL || "http://localhost:8000";

  const { getToken } = useAuth();
  const { hasPermission } = useAuthContext();

  const fetchNodeData = useCallback(async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/summary`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      let data = await response.json();
      if (!Array.isArray(data)) data = [];
      // Deduplicate by device_eui
      const uniqueNodes = Array.from(
        new Map(
          (data as ShortNodeData[]).map((node) => [node.device_eui, node]),
        ).values(),
      );
      setNodeData(uniqueNodes);
    } catch (error) {
      setNodeData([]);
      console.error("Error fetching node data:", error);
    }
  }, [API_URL, getToken]);

  const fetchSubscriptions = useCallback(async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/subscriptions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (Array.isArray(data)) setUserSubscriptions(data);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    }
  }, [API_URL, getToken]);

  const fetchAlerts = useCallback(async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/alerts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (Array.isArray(data)) setAlerts(data);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    }
  }, [API_URL, getToken]);

  useEffect(() => {
    fetchNodeData();
    fetchSubscriptions();
    fetchAlerts();
    const nodeDataInterval = setInterval(fetchNodeData, 3000);
    const alertsInterval = setInterval(fetchAlerts, 3000);
    const subscriptionsInterval = setInterval(fetchSubscriptions, 30000);
    return () => {
      clearInterval(nodeDataInterval);
      clearInterval(alertsInterval);
      clearInterval(subscriptionsInterval);
    };
  }, [fetchNodeData, fetchSubscriptions, fetchAlerts]);

  /////////////////////////////////////////////////////////////////////////////////////////
  //
  //         STATE AND HANDLERS
  //
  //  Multiple NodeCards can be expanded at once.
  //  A maximum of one Map Marker can be expanded at a time.
  //
  //  Logic for managing expanded nodes from both Map and NodeCard components
  //    clicking a NodeCard toggles its expanded state.
  //      if collapsed, it will also expand the corresponding marker on the Map.
  //      if expanded, it will collapse itself and any expanded markers on the Map.
  //    clicking a Marker expands that marker and corresponding NodeCard
  //      all other expanded markers and NodeCards collapse.
  //
  /////////////////////////////////////////////////////////////////////////////////////////

  const [expandedNodeEuis, setExpandedNodeEuis] = useState<string[]>([]);
  const [mostRecentExpandedNodeEui, setMostRecentExpandedNodeEui] = useState<
    string | null
  >(null);

  const toggleExpandFromCard = (nodeEui: string) => {
    if (expandedNodeEuis.includes(nodeEui)) {
      const remaining = expandedNodeEuis.filter((eui) => eui !== nodeEui);
      setExpandedNodeEuis(remaining);
      setMostRecentExpandedNodeEui(
        remaining.length === 1 ? remaining[0] : null,
      );
    } else {
      setExpandedNodeEuis([...expandedNodeEuis, nodeEui]);
      setMostRecentExpandedNodeEui(nodeEui);
    }
  };

  const toggleExpandFromMap = (nodeEui: string) => {
    if (expandedNodeEuis.includes(nodeEui)) {
      setExpandedNodeEuis([]);
      setMostRecentExpandedNodeEui(null);
    } else {
      setExpandedNodeEuis([nodeEui]);
      setMostRecentExpandedNodeEui(nodeEui);
    }
  };

  // End of STATE AND HANDLERS block //////////////////////////////////////////////////////

  useEffect(() => {
    if (showAcked) {
      setDisplayedAlerts(alerts);
    } else {
      setDisplayedAlerts(alerts.filter((alert) => !alert.acknowledged));
    }
  }, [alerts, showAcked]);

  if (!hasPermission("view_nodes")) {
    return (
      <div className="bg-slate-300 h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold mb-2">Access Restricted</p>
          <p className="text-slate-600">
            Your role does not have permission to view nodes and telemetry.
          </p>
          <p className="text-slate-500 text-sm mt-2">
            Contact your org admin to request access.
          </p>
        </div>
      </div>
    );
  }

  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <>
      <div className="bg-slate-300 h-[calc(100vh-4rem)] overflow-hidden">
        <div className="flex flex-col md:flex-row md:space-x-4 w-full h-full p-4 gap-2 md:gap-0">
          <div className="w-11/12 mx-auto md:w-auto md:mx-0 order-1 flex flex-col gap-2">
            <div className="lg:w-90 md:w-48 bg-slate-100 rounded-md p-4">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-bold">All Alerts</h2>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">
                  {unacknowledgedCount}
                </span>
                <span className="text-slate-500 text-sm">unacknowledged</span>
              </div>
            </div>

            {mostRecentExpandedNodeEui ? (
              <NodeDetails
                nodeEui={mostRecentExpandedNodeEui}
                showAcked={showAcked}
                setShowAcked={setShowAcked}
              />
            ) : (
              <div className="lg:w-90 md:w-48 bg-slate-100 rounded-md p-4 overflow-y-auto max-h-[20vh] md:max-h-none md:flex-1">
                {displayedAlerts.length === 0 ? (
                  <p className="text-gray-600">No alerts to display.</p>
                ) : (
                  <>
                    <div className="flex flex-row items-center justify-between mb-2">
                      <h2 className="text-xl font-bold">Recent Alerts</h2>
                      <ShowAckedButton
                        showAcked={showAcked}
                        setShowAcked={setShowAcked}
                      />
                    </div>
                    <ul className="space-y-2">
                      {displayedAlerts.map((alert) => (
                        <li key={alert.id} className="border-b pb-2">
                          <p>
                            <strong>Node:</strong> {alert.dev_eui}
                          </p>
                          <p>
                            <strong>Type:</strong> {alert.alert_type}
                          </p>
                          <p>{alert.message}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(alert.created_at).toLocaleString()}
                          </p>
                          <AlertAckButton
                            alertId={alert.id}
                            acknowledged={alert.acknowledged}
                            onAckChange={(acknowledged) => {
                              setAlerts((prevAlerts) =>
                                prevAlerts.map((a) =>
                                  a.id === alert.id
                                    ? { ...a, acknowledged }
                                    : a,
                                ),
                              );
                            }}
                          />
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="w-11/12 mx-auto md:mx-4 h-150 md:h-full md:flex-1 order-2">
            <WildfireMap
              nodeData={filteredNodeData}
              mostRecentExpandedNodeEui={mostRecentExpandedNodeEui}
              expandedNodeEuis={expandedNodeEuis}
              onMarkerClick={toggleExpandFromMap}
              setMapBounds={() => {}}
            />
          </div>

          <div className="w-11/12 mx-auto md:w-80 md:mx-0 grow min-h-0 md:grow-0 md:shrink-0 md:h-full order-3">
            <NodeListPanel
              nodeData={filteredNodeData}
              userSubscriptions={userSubscriptions}
              expandedNodeEuis={expandedNodeEuis}
              onCardClick={toggleExpandFromCard}
              apiBaseUrl={API_URL}
              onSubscriptionsChange={(subs) => setUserSubscriptions(subs)}
              onFilterChange={setFilterState}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
