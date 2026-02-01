import React from "react";
import type { NodeData } from "../../types/nodeTypes";
import NodeCard from "./NodeCard";

interface NodeCardListProps {
  nodeData: NodeData[];
  expandedNodeIds: string[];
  onClick: (nodeId: string) => void;
}

const NodeCardList: React.FC<NodeCardListProps> = ({
  nodeData,
  expandedNodeIds,
  onClick,
}) => {
  return (
    <div>
      <h2>Alert Nodes</h2>
      {nodeData
        .filter((node) => node.smoke_detected)
        .map((nodeData) => (
          <NodeCard
            key={nodeData.node_id}
            nodeData={nodeData}
            expandedNodeIds={expandedNodeIds}
            onClick={() => onClick(nodeData.node_id)}
          />
        ))}
      <h2>Warning Nodes</h2>
      {nodeData
        .filter((node) => node.battery_level < 20)
        .map((nodeData) => (
          <NodeCard
            key={nodeData.node_id}
            nodeData={nodeData}
            expandedNodeIds={expandedNodeIds}
            onClick={() => onClick(nodeData.node_id)}
          />
        ))}
      <h2>Nodes</h2>
      {nodeData
        .filter((node) => !node.smoke_detected && node.battery_level >= 20)
        .map((nodeData) => (
          <NodeCard
            key={nodeData.node_id}
            nodeData={nodeData}
            expandedNodeIds={expandedNodeIds}
            onClick={() => onClick(nodeData.node_id)}
          />
        ))}
    </div>
  );
};

export default NodeCardList;
