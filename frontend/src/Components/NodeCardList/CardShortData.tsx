import React from "react";
import type { NodeData } from "../../types/nodeTypes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";

interface NodeCardProps {
  nodeData: NodeData;
}

function decideIndicator(smoke_detected: boolean, battery_level: number) {
  if (smoke_detected) {
    return <FontAwesomeIcon icon={fas.faFire} className={`text-red-500 m-2`} />;
  } else if (battery_level < 20) {
    return (
      <FontAwesomeIcon
        icon={fas.faBatteryQuarter}
        className={`text-orange-500 m-2`}
      />
    );
  } else {
    return (
      <FontAwesomeIcon icon={fas.faCheck} className={`text-green-500 m-2`} />
    );
  }
}

const CardShortData: React.FC<NodeCardProps> = ({ nodeData }) => {
  return (
    <>
      {decideIndicator(nodeData.smoke_detected, nodeData.battery_level)}
      <div className="flex flex-col w-full justify-center my-2">
        <h3 className="text-sm">ID: {nodeData.node_id}</h3>
      </div>
    </>
  );
};

export default CardShortData;
