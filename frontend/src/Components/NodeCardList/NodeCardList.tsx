import type { NodeData } from "../../types/nodeTypes";
import NodeCard from "./NodeCard";

interface NodeCardListProps {
  nodeData: NodeData[];
  expandedNodeIds: string[];
  onCardClick: (nodeId: string) => void;
  apiBaseUrl: string;
  subscribedNodeIds?: string[];
  onSubscriptionsChange?: (subs: string[]) => void;
}

const NodeCardList: React.FC<NodeCardListProps> = ({
  nodeData,
  expandedNodeIds,
  onCardClick,
  apiBaseUrl,
  subscribedNodeIds = [],
  onSubscriptionsChange = () => {},
}) => {
  return (
    <div>
      {nodeData.length === 0 && <p>No nodes available.</p>}
      {nodeData.length > 0 ? <h2>Nodes</h2> : null}
      {nodeData &&
        nodeData.map((nodeData) => (
          <NodeCard
            key={nodeData.device_eui}
            nodeData={nodeData}
            expandedNodeIds={expandedNodeIds}
            onCardClick={() => onCardClick(nodeData.device_eui)}
            apiBaseUrl={apiBaseUrl}
            subscribedNodeIds={subscribedNodeIds}
            onSubscriptionsChange={onSubscriptionsChange}
          />
        ))}
    </div>
  );
};

export default NodeCardList;
