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

  const alertNodes: NodeData[] | null = nodeData.filter((node) => node.smoke_detected) || null;
  const warningNodes: NodeData[] | null = nodeData.filter(
    (node) => !node.smoke_detected && node.battery_level < 20
  ) || null;
  const normalNodes: NodeData[] | null = nodeData.filter(
    (node) => !node.smoke_detected && node.battery_level >= 20
  );

  return (
    <div>
      {nodeData.length === 0 && <p>No nodes available.</p>}
      {alertNodes.length > 0 ? <h2>Alert Nodes</h2> : null}
      {alertNodes && alertNodes.map((nodeData) => (
          <NodeCard
            key={nodeData.node_id}
            nodeData={nodeData}
            expandedNodeIds={expandedNodeIds}
            onClick={() => onClick(nodeData.node_id)}
          />
        ))}
      {warningNodes.length > 0 ? <h2>Warning Nodes</h2> : null}
      {warningNodes && warningNodes
        .map((nodeData) => (
          <NodeCard
            key={nodeData.node_id}
            nodeData={nodeData}
            expandedNodeIds={expandedNodeIds}
            onClick={() => onClick(nodeData.node_id)}
          />
        ))}
      {normalNodes.length > 0 ? <h2>Nodes</h2> : null}
      {normalNodes && normalNodes
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
