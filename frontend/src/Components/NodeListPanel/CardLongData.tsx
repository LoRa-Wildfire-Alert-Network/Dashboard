import React from "react";
import type { ShortNodeData } from "../../types/nodeTypes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";

interface NodeCardProps {
  nodeData: ShortNodeData;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  loading: boolean;
  canSubscribe: boolean;
  isSubscribed: boolean;
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

const CardLongData: React.FC<NodeCardProps> = ({
  nodeData,
  onClick,
  loading,
  canSubscribe,
  isSubscribed,
}) => {
  return (
    <>
      {decideIndicator(
        nodeData.smoke_detected,
        nodeData.battery_level,
        nodeData.humidity_pct,
        nodeData.temperature_c,
      )}
      <div className="flex flex-col w-80 h-24 justify-center my-4">
        <h3 className="text-sm mb-2">EUI: {nodeData.device_eui}</h3>
        <div className="flex flex-row items-center">
          {nodeData.smoke_detected ? (
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
        <div>
          {canSubscribe && (
            <button
              onClick={onClick}
              disabled={loading}
              className={`inline-flex items-center w-5/6 gap-2 px-3 py-1 rounded-md text-xs font-semibold border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                isSubscribed
                  ? "bg-slate-500 text-white border-slate-600 shadow-inner"
                  : "bg-white text-slate-500 border-slate-300 hover:border-slate-500 hover:text-slate-700"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                  isSubscribed ? "bg-green-400" : "bg-slate-300"
                }`}
              />
              {loading
                ? "Updating..."
                : isSubscribed
                  ? "Subscribed"
                  : "Subscribe"}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default CardLongData;
