import Map from "./../Map/Map";
import NodeCardList from "../NodeCardList/NodeCardList";
import type { NodeData } from "./../../types/nodeTypes";
import NodeFilter, { type NodeFilterState } from "../NodeFilter/NodeFilter";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";

const Dashboard: React.FC = () => {
  const [nodeData, setNodeData] = useState<NodeData[]>([]);

  const API_URL: string =
    import.meta.env.VITE_API_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchNodeData = async () => {
      try {
        const response = await fetch(`${API_URL}/latest`);
        const data = await response.json();
        setNodeData(data);
      } catch (error) {
        console.error("Error fetching node data:", error);
      }
    };

    fetchNodeData();
    const interval = setInterval(fetchNodeData, 3000);
    return () => clearInterval(interval);
  }, [API_URL]);

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

  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);
  const [filteredNodeList, setFilteredNodeList] = useState<NodeData[]>([]);
  const [nodeFilter, setNodeFilter] = useState(["alert", "warning", "normal"]);

  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [smokeDetected, setSmokeDetected] =
    useState<NodeFilterState["smokeDetected"]>();
  const [tempAbove, setTempAbove] = useState<NodeFilterState["tempAbove"]>();
  const [humidityBelow, setHumidityBelow] =
    useState<NodeFilterState["humidityBelow"]>();
  const [lowBattery, setLowBattery] = useState<NodeFilterState["lowBattery"]>();
  /*   const [lastSeenBefore, setLastSeenBefore] =
    useState<NodeFilterState["lastSeenBefore"]>(); */

  const applyFilter = (nodes: NodeData[]): NodeData[] => {
    let filteredNodes = [...nodes];

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
  };

  useEffect(() => {
    const updateDisplayedNodes = (mapBounds: L.LatLngBounds | null) => {
      if (mapBounds) {
        const visible = nodeData.filter((node) =>
          mapBounds.contains([node.latitude, node.longitude]),
        );
        setFilteredNodeList(applyFilter(visible));
      } else {
        setFilteredNodeList(applyFilter(nodeData));
      }
    };

    updateDisplayedNodes(mapBounds);
  }, [
    mapBounds,
    nodeData,
    nodeFilter,
    smokeDetected,
    tempAbove,
    humidityBelow,
    lowBattery,
  ]);

  return (
    <>
      <div className="bg-slate-300 h-[calc(100vh-4rem)]">
        <div className="flex space-x-4 w-full h-full p-4">
          <div className="flex-none lg:w-80 md:w-48 bg-slate-100 rounded-md p-4"></div>
          <Map
            nodeData={filteredNodeList}
            mostRecentExpandedNodeId={mostRecentExpandedNodeId}
            onMarkerClick={toggleExpandFromMap}
            setMapBounds={setMapBounds}
          />
          <div className="flex flex-col overflow-y-auto lg:w-100 md:w-60 bg-slate-400 rounded-md py-2 px-4">
            <div className="flex flex-row items-center justify-between mb-4">
              <h1 className="text-xl font-bold">Node List</h1>
              <FontAwesomeIcon
                icon={fas.faFilter}
                className="text-red-600 mr-2 hover:cursor-pointer"
                onClick={() => {
                  setShowFilter((s) => !s);
                }}
              />
            </div>
            {showFilter && (
              <NodeFilter
                onChange={(filters) => {
                  setSmokeDetected(filters.smokeDetected);
                  setTempAbove(filters.tempAbove);
                  setHumidityBelow(filters.humidityBelow);
                  setLowBattery(filters.lowBattery);
                  /* setLastSeenBefore(filters.lastSeenBefore); */
                }}
              />
            )}
            <NodeCardList
              nodeData={filteredNodeList}
              expandedNodeIds={expandedNodeIds}
              onCardClick={toggleExpandFromCard}
              nodeFilter={nodeFilter}
              setNodeFilter={setNodeFilter}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
