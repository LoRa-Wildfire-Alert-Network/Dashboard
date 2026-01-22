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

const CardShortData: React.FC<NodeCardProps> = ({ nodeData }) => {
  return (
    <>
      <span
        className={`block w-3 h-3 rounded-full p-2 m-4 ${decideIndicatorColor(nodeData.smoke_detected, nodeData.battery_level)}`}
      ></span>
      <div className="flex flex-col w-full items-center justify-center">
        <h3 className="text-sm mb-2">ID: {nodeData.node_id}</h3>
      </div>
    </>
  );
};

export default CardShortData;
