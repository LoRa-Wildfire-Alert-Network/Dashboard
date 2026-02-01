import React from "react";
import type { NodeData } from "../../types/nodeTypes";
import CardLongData from "./CardLongData";
import CardShortData from "./CardShortData";

interface NodeCardProps {
  nodeData: NodeData;
  expandedNodeIds: string[];
  onClick?: () => void;
}

const NodeCard: React.FC<NodeCardProps> = ({
  nodeData,
  expandedNodeIds,
  onClick,
}) => {
  return (
    <div
      className="flex flex-row items-center justify-center bg-slate-700 text-white rounded-md my-2 p-2 hover:cursor-pointer"
      onClick={onClick}
    >
      {expandedNodeIds.includes(nodeData.node_id) ? (
        <CardLongData nodeData={nodeData} />
      ) : (
        <CardShortData nodeData={nodeData} />
      )}
    </div>
  );
};

export default NodeCard;
