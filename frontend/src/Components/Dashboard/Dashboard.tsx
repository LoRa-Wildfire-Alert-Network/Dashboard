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

  const testData: NodeData[] = [
    {
      node_id: "a1f9b8c2-3d4e-4f1a-9b7e-0c2d5f6a7b8c",
      latitude: 44.5646,
      longitude: -123.262,
      temperature_c: 18.3,
      humidity_pct: 62,
      smoke_detected: false,
      battery_level: 100,
    },
    {
      node_id: "b2e7d9a1-6c3f-4b2a-8e9d-1a3c4f5b6e7d",
      latitude: 44.572,
      longitude: -123.2505,
      temperature_c: 22.1,
      humidity_pct: 48,
      smoke_detected: false,
      battery_level: 100,
    },
    {
      node_id: "c3d6e1f4-8b2a-4c6d-9f0e-2b4a6c7d8e9f",
      latitude: 44.5582,
      longitude: -123.2701,
      temperature_c: 12.7,
      humidity_pct: 55,
      smoke_detected: false,
      battery_level: 100,
    },
    {
      node_id: "d4e5f2a3-9c1b-4d7e-8a0f-3c5b7d8e9f0a",
      latitude: 44.5669,
      longitude: -123.2793,
      temperature_c: 9.4,
      humidity_pct: 71,
      smoke_detected: false,
      battery_level: 15,
    },
    {
      node_id: "e5f3a4b6-0d2c-4e8f-9b1a-4d6c8e9f0a1b",
      latitude: 44.5708,
      longitude: -123.2558,
      temperature_c: 14.8,
      humidity_pct: 59,
      smoke_detected: false,
      battery_level: 100,
    },
    {
      node_id: "f6a7b8c9-1d2e-4f3a-9b8c-5d6e7f8a9b0c",
      latitude: 44.5659,
      longitude: -123.2615,
      temperature_c: 16.2,
      humidity_pct: 60,
      smoke_detected: false,
      battery_level: 100,
    },
    {
      node_id: "a7b8c9d0-2e3f-4a5b-8c9d-6e7f8a9b0c1d",
      latitude: 44.5694,
      longitude: -123.2678,
      temperature_c: 19.0,
      humidity_pct: 52,
      smoke_detected: true,
      battery_level: 100,
    },
    {
      node_id: "b8c9d0e1-3f4a-5b6c-9d0e-7f8a9b0c1d2e",
      latitude: 44.5598,
      longitude: -123.255,
      temperature_c: 13.5,
      humidity_pct: 57,
      smoke_detected: false,
      battery_level: 15,
    },
    {
      node_id: "c9d0e1f2-4a5b-6c7d-0e1f-8a9b0c1d2e3f",
      latitude: 44.5762,
      longitude: -123.2734,
      temperature_c: 21.4,
      humidity_pct: 49,
      smoke_detected: true,
      battery_level: 100,
    },
    {
      node_id: "d0e1f2a3-5b6c-7d8e-1f2a-9b0c1d2e3f4a",
      latitude: 44.5623,
      longitude: -123.269,
      temperature_c: 11.9,
      humidity_pct: 65,
      smoke_detected: false,
      battery_level: 100,
    },
  ];

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
