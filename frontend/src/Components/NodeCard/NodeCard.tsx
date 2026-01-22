import React from "react";
import type { NodeData } from "../../types/nodeTypes";

interface NodeCardProps {
  nodeData: NodeData;
}

function decideIndicatorColor(smoke_detected: boolean, battery_level: number) {
  if (smoke_detected) {
    return "bg-red-500";
  } else if (battery_level < 20) {
    return "bg-orange-500";
  } else {
    return "bg-green-500";
  }
}

const NodeCard: React.FC<NodeCardProps> = ({ nodeData }) => {
  return (
    <div className="flex flex-row items-center justify-center bg-slate-700 text-white rounded-md my-2 p-2">
      <span
        className={`block w-3 h-3 rounded-full p-2 m-4 ${decideIndicatorColor(nodeData.smoke_detected, nodeData.battery_level)}`}
      ></span>
      <div className="flex flex-col w-full h-36 ">
        <h3 className="text-sm mb-2">ID: {nodeData.node_id}</h3>
        <p className="text-sm">Temperature: {nodeData.temperature_c} °C</p>
        <p className="text-sm">
          Smoke Detected?: {nodeData.smoke_detected ? "Yes" : "No"}
        </p>
        <p className="text-sm">Humidity: {nodeData.humidity_pct} %</p>
      </div>
    </div>
  );
};

export default NodeCard;
