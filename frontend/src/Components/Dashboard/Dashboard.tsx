import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import NodeSubscriptionButton from "../NodeSubscriptionModal/NodeSubscriptionButton";
import NodeCardList from "../NodeCardList/NodeCardList";
import type { ShortNodeData } from "./../../types/nodeTypes";
import NodeFilter, { type NodeFilterState } from "../NodeFilter/NodeFilter";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";
import WildfireMap from "../WildfireMap/WildfireMap";
import NodeDetails from "../NodeDetails/NodeDetails";

const Dashboard: React.FC = () => {
  const [nodeData, setNodeData] = useState<ShortNodeData[]>([]);
  const [userSubscriptions, setUserSubscriptions] = useState<string[]>([]);

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

  useEffect(() => {
    fetchNodeData();
    fetchSubscriptions();
    const interval = setInterval(fetchNodeData, 3000);
    return () => clearInterval(interval);
  }, [fetchNodeData, fetchSubscriptions]);

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

  const [expandedNodeIds, setExpandedNodeIds] = useState<string[]>([]);
  const [mostRecentExpandedNodeId, setMostRecentExpandedNodeId] = useState<
    string | null
  >(null);

  const toggleExpandFromCard = (nodeId: string) => {
    if (expandedNodeIds.includes(nodeId)) {
      setExpandedNodeIds(expandedNodeIds.filter((id) => id !== nodeId));
      setMostRecentExpandedNodeId(null);
    } else {
      setExpandedNodeIds([...expandedNodeIds, nodeId]);
      setMostRecentExpandedNodeId(nodeId);
    }
  };

  const toggleExpandFromMap = (nodeId: string) => {
    if (expandedNodeIds.includes(nodeId)) {
      setExpandedNodeIds([]);
      setMostRecentExpandedNodeId(null);
    } else {
      setExpandedNodeIds([nodeId]);
      setMostRecentExpandedNodeId(nodeId);
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

  return (
    <>
      <div className="bg-slate-300 h-[calc(100vh-4rem)]">
        <div className="flex space-x-4 w-full h-full p-4">
          <NodeDetails nodeId={mostRecentExpandedNodeId} />
          <WildfireMap
            nodeData={nodeData.filter((node) =>
              userSubscriptions.includes(node.device_eui),
            )}
            mostRecentExpandedDeviceEui={mostRecentExpandedNodeId}
            expandedNodeIds={expandedNodeIds}
            onMarkerClick={toggleExpandFromMap}
            setMapBounds={() => {}}
          />
          <div className="flex flex-col overflow-y-auto lg:w-100 md:w-60 bg-slate-400 rounded-md py-2 px-4">
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
              expandedNodeIds={expandedNodeIds}
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
