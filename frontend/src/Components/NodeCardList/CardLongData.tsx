import React from "react";
import type { ShortNodeData } from "../../types/nodeTypes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";

interface NodeCardProps {
  nodeData: ShortNodeData;
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

const CardLongData: React.FC<NodeCardProps> = ({ nodeData }) => {
  return (
    <>
      {decideIndicator(nodeData.smoke_detected, nodeData.battery_level)}
      <div className="flex flex-col w-full h-24 justify-center my-4">
        <h3 className="text-sm mb-2">ID: {nodeData.node_id}</h3>
        <p className="text-sm">Temperature: {nodeData.temperature_c} °C</p>
        <p className="text-sm">
          Smoke Detected?: {nodeData.smoke_detected ? "Yes" : "No"}
        </p>
        <p className="text-sm">Humidity: {nodeData.humidity_pct} %</p>
        <p className="text-sm">Battery Level: {nodeData.battery_level} %</p>
      </div>
    </>
  );
};

export default CardLongData;
