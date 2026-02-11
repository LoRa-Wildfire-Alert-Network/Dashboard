import { useEffect, useState } from "react";

///////////////////////////////////////////////////////////////////////////////
//
//
// Filter implementation heavily inspired by
//  https://github.com/cosdensolutions/code/tree/master/videos/long/react-custom-filter-component
//
//
///////////////////////////////////////////////////////////////////////////////

interface NodeFilterProps {
  onChange: (filter: NodeFilterState) => void;
}

export type NodeFilterState = {
  smokeDetected?: boolean;
  tempAbove?: number;
  humidityBelow?: number;
  lowBattery?: boolean;
  // Please leave; Not implemented yet, would require backend support
  /* timeSinceLastSeen?: Date; */
};

const NodeFilter = ({ onChange }: NodeFilterProps) => {
  const [smokeDetected, setSmokeDetected] =
    useState<NodeFilterState["smokeDetected"]>(false);
  const [tempAbove, setTempAbove] = useState<NodeFilterState["tempAbove"]>();
  const [humidityBelow, setHumidityBelow] =
    useState<NodeFilterState["humidityBelow"]>();
  const [lowBattery, setLowBattery] =
    useState<NodeFilterState["lowBattery"]>(false);
  // Please leave; Not implemented yet, would require backend support
  /*   const [timeSinceLastSeen, setTimeSinceLastSeen] =
    useState<NodeFilterState["timeSinceLastSeen"]>(); */

  const [showTempAboveInput, setShowTempAboveInput] = useState<boolean>(false);
  const [showHumidityBelowInput, setShowHumidityBelowInput] =
    useState<boolean>(false);
  // Please leave; Not implemented yet, would require backend support
  /*   const [showTimeSinceLastSeen, setShowTimeSinceLastSeen] =
    useState<boolean>(false); */

  useEffect(() => {
    onChange({
      smokeDetected,
      tempAbove,
      humidityBelow,
      lowBattery,
      /* timeSinceLastSeen, */
    });
  }, [onChange, smokeDetected, tempAbove, humidityBelow, lowBattery]);

  return (
    <div className="flex flex-col bg-white p-4 rounded shadow-lg">
      <h2 className="text-lg font-bold mb-2">Filter Options</h2>
      <h3 className="text-lg font-bold mb-2">Alerts</h3>
      <label className="flex items-center mb-2 ml-4">
        <input
          type="checkbox"
          className="mr-2"
          onChange={() => setSmokeDetected(!smokeDetected)}
          checked={!!smokeDetected}
        />
        Smoke Detected
      </label>
      <label className="flex items-center mb-2 ml-4">
        <input
          type="checkbox"
          className="mr-2"
          onChange={() => {
            setShowTempAboveInput(!showTempAboveInput);
            setTempAbove(undefined);
          }}
          checked={showTempAboveInput}
        />
        Temp above
      </label>
      {showTempAboveInput && (
        <label className="flex items-center mb-2 ml-8">
          <input
            type="text"
            value={tempAbove ?? ""}
            className="mr-2 w-20 outline-none border border-gray-300 rounded px-2 py-1"
            onChange={(e) =>
              setTempAbove(
                e.target.value === "" ? undefined : Number(e.target.value),
              )
            }
          />
          &deg;C
        </label>
      )}
      <label className="flex items-center mb-2 ml-4">
        <input
          type="checkbox"
          className="mr-2"
          onChange={() => {
            setShowHumidityBelowInput(!showHumidityBelowInput);
            setHumidityBelow(undefined);
          }}
          checked={showHumidityBelowInput}
        />
        Humidity below
      </label>
      {showHumidityBelowInput && (
        <label className="flex items-center mb-2 ml-8">
          <input
            type="text"
            value={humidityBelow ?? ""}
            className="mr-2 w-20 outline-none border border-gray-300 rounded px-2 py-1"
            onChange={(e) =>
              setHumidityBelow(
                e.target.value === "" ? undefined : Number(e.target.value),
              )
            }
          />{" "}
          %
        </label>
      )}
      <h3 className="text-lg font-bold mb-2">Node Health</h3>
      <label className="flex items-center mb-2 ml-4">
        <input
          type="checkbox"
          className="mr-2"
          onChange={() => setLowBattery(!lowBattery)}
          checked={!!lowBattery}
        />
        Low battery (&lt; 20%)
      </label>
    </div>
  );
};

export default NodeFilter;
