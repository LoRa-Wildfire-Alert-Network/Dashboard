import { useState } from "react";
import NodeCardList from "./NodeCardList";
import NodeFilter, { type NodeFilterState } from "../NodeFilter/NodeFilter";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";
import type { ShortNodeData } from "../../types/nodeTypes";

type NodeListPanelProps = {
  nodeData: ShortNodeData[];
  userSubscriptions: string[];
  expandedNodeEuis: string[];
  onCardClick: (nodeEui: string) => void;
  apiBaseUrl: string;
  onSubscriptionsChange: (subs: string[]) => void;
  onFilterChange: (filter: NodeFilterState) => void;
};

const NodeListPanel: React.FC<NodeListPanelProps> = ({
  nodeData,
  userSubscriptions,
  expandedNodeEuis,
  onCardClick,
  apiBaseUrl,
  onSubscriptionsChange,
  onFilterChange,
}) => {
  const [showFilter, setShowFilter] = useState<boolean>(false);

  return (
    <div className="flex flex-col overflow-y-auto w-full h-full bg-gray-800 rounded-md py-2 px-4 border border-gray-700">
      <div className="flex flex-row items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-white">Node List</h1>
        <FontAwesomeIcon
          icon={fas.faFilter}
          className="text-gray-400 mr-2 hover:text-amber-400 hover:cursor-pointer transition-colors"
          onClick={() => setShowFilter((s) => !s)}
        />
      </div>
      {showFilter && <NodeFilter onChange={onFilterChange} />}
      <NodeCardList
        nodeData={nodeData}
        expandedNodeEuis={expandedNodeEuis}
        onCardClick={onCardClick}
        apiBaseUrl={apiBaseUrl}
        subscribedNodeIds={userSubscriptions}
        onSubscriptionsChange={onSubscriptionsChange}
      />
    </div>
  );
};

export default NodeListPanel;
