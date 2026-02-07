import React, { useState } from "react";
import type { NodeData } from "../../types/nodeTypes";
import NodeCard from "./NodeCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";
import FilterPopup from "./FilterPopup";

interface NodeCardListProps {
  nodeData: NodeData[];
  expandedNodeIds: string[];
  onCardClick: (nodeId: string) => void;
}

const NodeCardList: React.FC<NodeCardListProps> = ({
  nodeData,
  expandedNodeIds,
  onCardClick,
}) => {
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [showAlertNodes, setShowAlertNodes] = useState<boolean>(true);
  const [showWarningNodes, setShowWarningNodes] = useState<boolean>(true);
  const [showNormalNodes, setShowNormalNodes] = useState<boolean>(true);

  const alertNodes: NodeData[] | null =
    nodeData.filter((node) => node.smoke_detected) || null;
  const warningNodes: NodeData[] | null =
    nodeData.filter(
      (node) => !node.smoke_detected && node.battery_level < 20,
    ) || null;
  const normalNodes: NodeData[] | null = nodeData.filter(
    (node) => !node.smoke_detected && node.battery_level >= 20,
  );

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
        <FilterPopup
          onClickNormal={() => setShowNormalNodes((s) => !s)}
          onClickAlert={() => setShowAlertNodes((s) => !s)}
          onClickWarning={() => setShowWarningNodes((s) => !s)}
          showAlertNodes={showAlertNodes}
          showWarningNodes={showWarningNodes}
          showNormalNodes={showNormalNodes}
        />
      )}
      {nodeData.length === 0 && <p>No nodes available.</p>}
      {(alertNodes.length > 0 ? <h2>Alert Nodes</h2> : null) && showAlertNodes}
      {alertNodes &&
        showAlertNodes &&
        alertNodes.map((nodeData) => (
          <NodeCard
            key={nodeData.node_id}
            nodeData={nodeData}
            expandedNodeIds={expandedNodeIds}
            onCardClick={() => onCardClick(nodeData.node_id)}
          />
        ))}
      {(warningNodes.length > 0 ? <h2>Warning Nodes</h2> : null) &&
        showWarningNodes}
      {warningNodes &&
        showWarningNodes &&
        warningNodes.map((nodeData) => (
          <NodeCard
            key={nodeData.node_id}
            nodeData={nodeData}
            expandedNodeIds={expandedNodeIds}
            onCardClick={() => onCardClick(nodeData.node_id)}
          />
        ))}
      {(normalNodes.length > 0 ? <h2>Nodes</h2> : null) && showNormalNodes}
      {normalNodes &&
        showNormalNodes &&
        normalNodes.map((nodeData) => (
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
