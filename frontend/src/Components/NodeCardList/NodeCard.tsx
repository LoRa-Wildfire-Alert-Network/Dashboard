import React from "react";
import type { NodeData } from "../../types/nodeTypes";
import CardLongData from "./CardLongData";
import CardShortData from "./CardShortData";

interface NodeCardProps {
  nodeData: NodeData;
  expandedNodeIds: string[];
  onCardClick?: () => void;
}

const NodeCard: React.FC<NodeCardProps> = ({
  nodeData,
  expandedNodeIds,
  onCardClick,
}) => {
  return (
    <div
      className="flex flex-row items-center justify-center bg-slate-700 text-white rounded-md my-2 p-2 hover:cursor-pointer"
      onClick={onCardClick}
    >
      {expandedNodeIds.includes(nodeData.device_eui) ? (
        <CardLongData nodeData={nodeData} />
      ) : (
        <CardShortData nodeData={nodeData} />
      )}
    </div>
  );
};

export default NodeCard;
