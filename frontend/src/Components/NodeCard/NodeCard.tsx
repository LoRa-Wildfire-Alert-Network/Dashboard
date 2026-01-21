import React from "react";
import type { NodeData } from "../../types/nodeTypes";

interface NodeCardProps {
  nodeData: NodeData;
}

const NodeCard: React.FC<NodeCardProps> = ({ nodeData }) => {
  return (
    <div className="flex flex-col w-full h-36 bg-slate-700 text-white rounded-md my-2 p-4">
      <h3 className="text-sm mb-2">ID: {nodeData.node_id}</h3>
      <p className="text-sm">Temperature: {nodeData.temperature_c} °C</p>
      <p className="text-sm">
        Smoke Detected?: {nodeData.smoke_detected ? "Yes" : "No"}
      </p>
      <p className="text-sm">Humidity: {nodeData.humidity_pct} %</p>
    </div>
  );
};

export default NodeCard;
