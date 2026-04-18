import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import NodeSubscriptionButton from "../NodeSubscriptionModal/NodeSubscriptionButton";
import NodeCardList from "../NodeCardList/NodeCardList";
import type { ShortNodeData, Alert } from "./../../types/nodeTypes";
import NodeFilter, { type NodeFilterState } from "../NodeFilter/NodeFilter";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";
import WildfireMap from "../WildfireMap/WildfireMap";
import NodeDetails from "../NodeDetails/NodeDetails";

const Dashboard: React.FC = () => {
  const [nodeData, setNodeData] = useState<ShortNodeData[]>([]);
  const [userSubscriptions, setUserSubscriptions] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showAcked, setShowAcked] = useState<boolean>(false);
  const [displayedAlerts, setDisplayedAlerts] = useState<Alert[]>([]);

  const API_URL: string =
    import.meta.env.VITE_API_URL || "http://localhost:8000";

  const { getToken } = useAuth();
  const fetchNodeData = React.useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/summary`);
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
      setNodeData([]); // fallback to empty array on error
      console.error("Error fetching node data:", error);
    }
  }, [API_URL]);

  const fetchSubscriptions = React.useCallback(async () => {
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

  const fetchAlerts = React.useCallback(async () => {
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
  //
  //
  /////////////////////////////////////////////////////////////////////////////////////////

  const [expandedNodeEuis, setExpandedNodeEuis] = useState<string[]>([]);
  const [mostRecentExpandedNodeEui, setMostRecentExpandedNodeEui] = useState<
    string | null
  >(null);

  const toggleExpandFromCard = (nodeEui: string) => {
    if (expandedNodeEuis.includes(nodeEui)) {
      setExpandedNodeEuis(expandedNodeEuis.filter((Eui) => Eui !== nodeEui));
      setMostRecentExpandedNodeEui(null);
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

  const [filteredNodeList, setFilteredNodeList] = useState<ShortNodeData[]>([]);
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [smokeDetected, setSmokeDetected] =
    useState<NodeFilterState["smokeDetected"]>();
  const [tempAbove, setTempAbove] = useState<NodeFilterState["tempAbove"]>();
  const [humidityBelow, setHumidityBelow] =
    useState<NodeFilterState["humidityBelow"]>();
  const [lowBattery, setLowBattery] = useState<NodeFilterState["lowBattery"]>();
  // Please leave; Not implemented yet, would require backend support
  /*   const [timeSinceLastSeen, setTimeSinceLastSeen] =
    useState<NodeFilterState["timeSinceLastSeen"]>(); */
  const [onlySubscribed, setOnlySubscribed] = useState<boolean>(false);

  const applyFilter = React.useCallback(
    (nodes: ShortNodeData[]): ShortNodeData[] => {
      let filteredNodes = [...nodes];

      if (onlySubscribed) {
        filteredNodes = filteredNodes.filter((node) =>
          userSubscriptions.includes(node.device_eui),
        );
      }
      if (smokeDetected) {
        filteredNodes = filteredNodes.filter((node) => node.smoke_detected);
      }
      if (tempAbove !== undefined) {
        filteredNodes = filteredNodes.filter(
          (node) => node.temperature_c > tempAbove,
        );
      }
      if (humidityBelow !== undefined) {
        filteredNodes = filteredNodes.filter(
          (node) => node.humidity_pct < humidityBelow,
        );
      }
      if (lowBattery) {
        filteredNodes = filteredNodes.filter((node) => node.battery_level < 20);
      }

      return filteredNodes;
    },
    [
      smokeDetected,
      tempAbove,
      humidityBelow,
      lowBattery,
      onlySubscribed,
      userSubscriptions,
    ],
  );

  useEffect(() => {
    setFilteredNodeList(applyFilter(nodeData));
  }, [applyFilter, nodeData]);

  useEffect(() => {
    if (showAcked) {
      setDisplayedAlerts(alerts);
    } else {
      setDisplayedAlerts(alerts.filter((alert) => !alert.acknowledged));
    }
  }, [alerts, showAcked]);

  return (
    <>
      <div className="bg-slate-300 h-[calc(100vh-4rem)] overflow-hidden">
        <div className="flex flex-col md:flex-row justify-center space-x-4 w-full h-full py-2 p-4">
          <div
            className={`w-11/12 mx-auto md:w-auto md:mx-0 order-3 md:order-1 py-2 md:py-0 grow transition-all duration-200`}
          >
            {mostRecentExpandedNodeEui ? (
              <NodeDetails
                nodeEui={mostRecentExpandedNodeEui}
                showAcked={showAcked}
                setShowAcked={setShowAcked}
              />
            ) : alerts.length > 0 ? (
              <div className="flex-1 max-h-[30vh] md:max-h-full md:h-full lg:w-90 md:w-48 bg-slate-100 rounded-md p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Recent Alerts</h2>
                  <button
                    onClick={() => setShowAcked(!showAcked)}
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-200 ${
                      showAcked
                        ? "bg-slate-600 text-white border-slate-600 shadow-inner"
                        : "bg-white text-slate-500 border-slate-300 hover:border-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                        showAcked ? "bg-green-400" : "bg-slate-300"
                      }`}
                    />
                    {showAcked ? "Showing Acknowledged" : "Show Acknowledged"}
                  </button>
                </div>

                <ul className="space-y-2 overflow-y-auto">
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
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex-1 md:max-h-full md:h-full lg:w-90 md:w-48 bg-slate-100 rounded-md p-4 overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">No Node Selected</h2>
                <p className="text-gray-600">
                  Click on a node card or map marker to see details here.
                </p>
              </div>
            )}
          </div>
          <div className="w-11/12 mx-auto md:mx-4 min-h-[30vh] h-full py-2 md:py-0 order-1 md:order-2">
            <WildfireMap
              nodeData={nodeData.filter((node) =>
                userSubscriptions.includes(node.device_eui),
              )}
              mostRecentExpandedNodeEui={mostRecentExpandedNodeEui}
              expandedNodeEuis={expandedNodeEuis}
              onMarkerClick={toggleExpandFromMap}
              setMapBounds={() => {}}
            />
          </div>
          <div className="flex flex-col overflow-y-auto w-11/12 mx-auto md:w-100 lg:w-120 md:mx-0 bg-slate-400 rounded-md py-2 px-4 order-2 md:order-3">
            <div className="flex flex-row items-center justify-between mb-4">
              <h1 className="text-xl font-bold">Node List</h1>
              <div className="flex flex-row gap-2 items-center">
                <NodeSubscriptionButton
                  apiBaseUrl={API_URL}
                  onSubscriptionsChange={() => {
                    fetchNodeData();
                    fetchSubscriptions();
                  }}
                />
                <FontAwesomeIcon
                  icon={fas.faFilter}
                  className="text-black mr-2 hover:cursor-pointer"
                  onClick={() => {
                    setShowFilter((s) => !s);
                  }}
                />
              </div>
            </div>
            {showFilter && (
              <NodeFilter
                onChange={(filters) => {
                  setSmokeDetected(filters.smokeDetected);
                  setTempAbove(filters.tempAbove);
                  setHumidityBelow(filters.humidityBelow);
                  setLowBattery(filters.lowBattery);
                  setOnlySubscribed(!!filters.onlySubscribed);
                }}
              />
            )}
            <NodeCardList
              nodeData={filteredNodeList}
              expandedNodeEuis={expandedNodeEuis}
              onCardClick={toggleExpandFromCard}
              apiBaseUrl={API_URL}
              subscribedNodeIds={userSubscriptions}
              onSubscriptionsChange={(subs) => {
                setUserSubscriptions(subs);
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
