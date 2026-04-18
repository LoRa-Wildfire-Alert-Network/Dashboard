import { useCallback, useEffect, useState } from "react";
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
};

const NodeListPanel: React.FC<NodeListPanelProps> = ({
  nodeData,
  userSubscriptions,
  expandedNodeEuis,
  onCardClick,
  apiBaseUrl,
  onSubscriptionsChange,
}) => {
  const [filteredNodeList, setFilteredNodeList] = useState<ShortNodeData[]>([]);
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [smokeDetected, setSmokeDetected] =
    useState<NodeFilterState["smokeDetected"]>();
  const [tempAbove, setTempAbove] = useState<NodeFilterState["tempAbove"]>();
  const [humidityBelow, setHumidityBelow] =
    useState<NodeFilterState["humidityBelow"]>();
  const [lowBattery, setLowBattery] = useState<NodeFilterState["lowBattery"]>();
  // Please leave; Not implemented yet, would require backend support
  /*   const [timeSinceLastSeen, setTimeSinceLastSeen] =
    useState<NodeFilterState["timeSinceLastSeen"]>(); */
  const [onlySubscribed, setOnlySubscribed] = useState<boolean>(false);

  const applyFilter = useCallback(
    (nodes: ShortNodeData[]): ShortNodeData[] => {
      let filteredNodes = [...nodes];
      if (onlySubscribed) {
        filteredNodes = filteredNodes.filter((node) =>
          userSubscriptions.includes(node.device_eui),
        );
      }
      if (smokeDetected) {
        filteredNodes = filteredNodes.filter((node) => node.smoke_detected);
      }
      if (tempAbove !== undefined) {
        filteredNodes = filteredNodes.filter(
          (node) => node.temperature_c > tempAbove,
        );
      }
      if (humidityBelow !== undefined) {
        filteredNodes = filteredNodes.filter(
          (node) => node.humidity_pct < humidityBelow,
        );
      }
      if (lowBattery) {
        filteredNodes = filteredNodes.filter((node) => node.battery_level < 20);
      }
      return filteredNodes;
    },
    [
      smokeDetected,
      tempAbove,
      humidityBelow,
      lowBattery,
      onlySubscribed,
      userSubscriptions,
    ],
  );

  useEffect(() => {
    setFilteredNodeList(applyFilter(nodeData));
  }, [applyFilter, nodeData]);

  return (
    <div className="flex flex-col overflow-y-auto w-full h-full bg-slate-400 rounded-md py-2 px-4">
      <div className="flex flex-row items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Node List</h1>
        <FontAwesomeIcon
          icon={fas.faFilter}
          className="text-black mr-2 hover:cursor-pointer"
          onClick={() => setShowFilter((s) => !s)}
        />
      </div>
      {showFilter && (
        <NodeFilter
          onChange={(filters) => {
            setSmokeDetected(filters.smokeDetected);
            setTempAbove(filters.tempAbove);
            setHumidityBelow(filters.humidityBelow);
            setLowBattery(filters.lowBattery);
            setOnlySubscribed(!!filters.onlySubscribed);
          }}
        />
      )}
      <NodeCardList
        nodeData={filteredNodeList}
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
