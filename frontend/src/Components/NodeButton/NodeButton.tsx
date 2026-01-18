import React from "react";

type NodeData = {
  id: string | number;
  temperature: number;
  airquality: number;
  humidity: number;
  latitude: number;
  longitude: number;
};

interface NodeButtonProps {
  nodeData: NodeData;
}

const NodeButton: React.FC<NodeButtonProps> = ({ nodeData }) => {
  return (
    <div className="flex flex-col w-full h-36 bg-slate-700 text-white rounded-md my-4 p-4">
      <h3 className="text-sm mb-2">ID: {nodeData.id}</h3>
      <p className="text-sm">Temperature: {nodeData.temperature} °C</p>
      <p className="text-sm">Air Quality: {nodeData.airquality}</p>
      <p className="text-sm">Humidity: {nodeData.humidity} %</p>
    </div>
  );
};

export default NodeButton;
