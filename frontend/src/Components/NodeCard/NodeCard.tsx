import React from "react";
import type { NodeData } from "../../types/nodeTypes";
import { useState } from "react";
import CardLongData from "./CardLongData";
import CardShortData from "./CardShortData";

interface NodeCardProps {
  nodeData: NodeData;
}

const NodeCard: React.FC<NodeCardProps> = ({ nodeData }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      onClick={toggleExpand}
      className="flex flex-row items-center justify-center bg-slate-700 text-white rounded-md my-2 p-2 hover:cursor-pointer"
    >
      {isExpanded ? (
        <CardLongData nodeData={nodeData} />
      ) : (
        <CardShortData nodeData={nodeData} />
      )}
    </div>
  );
};

export default NodeCard;
