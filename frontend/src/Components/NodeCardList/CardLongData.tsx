import React from "react";
import type { ShortNodeData } from "../../types/nodeTypes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";

interface NodeCardProps {
  nodeData: ShortNodeData;
}

function decideIndicator(
  smoke_detected: boolean,
  battery_level: number,
  humidity_pct: number,
  temperature_c: number,
) {
  if (smoke_detected) {
    return <FontAwesomeIcon icon={fas.faFire} className={`text-red-500 m-2`} />;
  } else if (humidity_pct < 15 || temperature_c > 35) {
    <FontAwesomeIcon
      icon={fas.faTriangleExclamation}
      className={`text-orange-500 m-2`}
    />;
  } else if (battery_level < 20) {
    return (
      <FontAwesomeIcon icon={fas.faMobile} className={`text-yellow-300 m-2`} />
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
      {decideIndicator(
        nodeData.smoke_detected,
        nodeData.battery_level,
        nodeData.humidity_pct,
        nodeData.temperature_c,
      )}
      <div className="flex flex-col w-full h-24 justify-center my-4">
        <h3 className="text-sm mb-2">EUI: {nodeData.device_eui}</h3>
        <div className="flex flex-row">
          {nodeData.smoke_detected === true ? (
            <FontAwesomeIcon
              icon={fas.faCircleExclamation}
              className="text-red-500 mr-3"
            />
          ) : (
            <div className="ml-8" />
          )}
          <p className="text-sm">
            Smoke Detected?: {nodeData.smoke_detected ? "Yes" : "No"}
          </p>
        </div>
        <div className="flex flex-row">
          {nodeData.temperature_c > 35 ? (
            <FontAwesomeIcon
              icon={fas.faTemperatureArrowUp}
              className="text-orange-500 mr-3"
            />
          ) : (
            <div className="ml-8" />
          )}
          <p className="text-sm">Temperature: {nodeData.temperature_c} °C</p>
        </div>
        <div className="flex flex-row">
          {nodeData.humidity_pct < 15 ? (
            <FontAwesomeIcon
              icon={fas.faDroplet}
              className="text-orange-500 mr-3"
            />
          ) : (
            <div className="ml-8" />
          )}
          <p className="text-sm">Humidity: {nodeData.humidity_pct} %</p>
        </div>
        <div className="flex flex-row">
          {nodeData.battery_level < 20 ? (
            <FontAwesomeIcon
              icon={fas.faBatteryHalf}
              className="text-yellow-300 mr-3"
            />
          ) : (
            <div className="ml-8" />
          )}
          <p className="text-sm">Battery Level: {nodeData.battery_level} %</p>
        </div>
      </div>
    </>
  );
};

export default CardLongData;
