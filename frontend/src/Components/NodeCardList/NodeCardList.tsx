import React, { useState } from "react";
import type { NodeData } from "../../types/nodeTypes";
import NodeCard from "./NodeCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";
import NodeFilter from "../NodeFilter/NodeFilter";

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
  nodeFilter,
  setNodeFilter,
}) => {
  const [showFilter, setShowFilter] = useState<boolean>(false);

  return (
    <div>
      <div className="flex flex-row items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Node List</h1>
        <FontAwesomeIcon
          icon={fas.faFilter}
          className="text-red-600 mr-2 hover:cursor-pointer"
          onClick={() => {
            setShowFilter((s) => !s);
          }}
        />
      </div>
      {showFilter && (
        <NodeFilter
          onClickNormal={() => {
            if (nodeFilter.includes("normal")) {
              setNodeFilter(nodeFilter.filter((f) => f !== "normal"));
              return;
            }
            setNodeFilter([...nodeFilter, "normal"]);
          }}
          onClickAlert={() => {
            if (nodeFilter.includes("alert")) {
              setNodeFilter(nodeFilter.filter((f) => f !== "alert"));
              return;
            }
            setNodeFilter([...nodeFilter, "alert"]);
          }}
          onClickWarning={() => {
            if (nodeFilter.includes("warning")) {
              setNodeFilter(nodeFilter.filter((f) => f !== "warning"));
              return;
            }
            setNodeFilter([...nodeFilter, "warning"]);
          }}
          nodeFilter={nodeFilter}
        />
      )}
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
