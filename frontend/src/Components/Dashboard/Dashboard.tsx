import Map from "./../Map/Map";
import NodeCardList from "../NodeCardList/NodeCardList";
import type { NodeData } from "./../../types/nodeTypes";

import { useEffect, useState } from "react";

const Dashboard: React.FC = () => {
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

  const [nodeData, setNodeData] = useState<NodeData[]>([]);
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

  /////////////////////////////////////////////////////////////////////////////////////////

  useEffect(() => {
    // For now, use test data
    setNodeData(testData);
  }, []);

  /* 

  Please leave this here; waiting to request backend changes before re-implementing
  
  useEffect(() => {
    async function fetchNodeData() {
      try {
        const response = await fetch("http://localhost:8000/latest");
        const data = await response.json();
        setNodeData(data);
      } catch (error) {
        console.error("Error fetching node data:", error);
      }
    }
  */

  return (
    <>
      <div className="bg-slate-300 h-[calc(100vh-4rem)]">
        <div className="flex space-x-4 w-full h-full p-4">
          <div className="flex-none lg:w-80 md:w-48 bg-slate-100 rounded-md p-4">
            <h2 className="text-xl font-semibold mb-2">Column 1</h2>
            <p>First Column</p>
          </div>
          <Map
            nodeData={nodeData}
            mostRecentExpandedNodeId={mostRecentExpandedNodeId}
            onClick={toggleExpandFromMap}
          />
          <div className="flex flex-col overflow-y-auto lg:w-100 md:w-60 bg-slate-400 rounded-md py-2 px-4">
            <NodeCardList
              nodeData={nodeData}
              expandedNodeIds={expandedNodeIds}
              onClick={toggleExpandFromCard}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
