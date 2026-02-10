import type { NodeData } from "../../types/nodeTypes";
import NodeCard from "./NodeCard";

interface NodeCardListProps {
  nodeData: NodeData[];
  expandedNodeIds: string[];
  onCardClick: (nodeId: string) => void;
  nodeFilter: string[];
  setNodeFilter: React.Dispatch<React.SetStateAction<any>>;
}

const NodeCardList: React.FC<NodeCardListProps> = ({
  nodeData,
  expandedNodeIds,
  onCardClick,
}) => {
  return (
    <div>
      {nodeData.length === 0 && <p>No nodes available.</p>}
      {nodeData.length > 0 ? <h2>Nodes</h2> : null}
      {nodeData &&
        nodeData.map((nodeData) => (
          <NodeCard
            key={nodeData.node_id}
            nodeData={nodeData}
            expandedNodeIds={expandedNodeIds}
            onCardClick={() => onCardClick(nodeData.node_id)}
          />
        ))}
    </div>
  );
};

export default NodeCardList;
