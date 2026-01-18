import React from "react";
import type { NodeData } from "../../types/nodeTypes";

interface NodeCardProps {
  nodeData: NodeData;
}

const NodeCard: React.FC<NodeCardProps> = ({ nodeData }) => {
  return (
    <div className="flex flex-col w-full h-36 bg-slate-700 text-white rounded-md my-4 p-4">
      <h3 className="text-sm mb-2">ID: {nodeData.id}</h3>
      <p className="text-sm">Temperature: {nodeData.temperature} °C</p>
      <p className="text-sm">Air Quality: {nodeData.airquality}</p>
      <p className="text-sm">Humidity: {nodeData.humidity} %</p>
    </div>
  );
};

export default NodeCard;
