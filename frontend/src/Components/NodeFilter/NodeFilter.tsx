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
  onlySubscribed?: boolean;
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
  const [onlySubscribed, setOnlySubscribed] = useState(false);

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
      onlySubscribed,
      /* timeSinceLastSeen, */
    });
  }, [onChange, smokeDetected, tempAbove, humidityBelow, lowBattery, onlySubscribed]);

  return (
    <div className="flex flex-col bg-gray-900 p-4 rounded border border-gray-700 mb-2">
      <h2 className="text-base font-semibold text-amber-400 uppercase tracking-wide mb-3">Filter Options</h2>
      <label className="flex items-center mb-2 ml-2 text-gray-300 text-sm">
        <input
          type="checkbox"
          className="mr-2 accent-amber-500"
          onChange={() => setOnlySubscribed(!onlySubscribed)}
          checked={!!onlySubscribed}
        />
        Only show subscribed nodes
      </label>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Alerts</h3>
      <label className="flex items-center mb-2 ml-2 text-gray-300 text-sm">
        <input
          type="checkbox"
          className="mr-2 accent-amber-500"
          onChange={() => setSmokeDetected(!smokeDetected)}
          checked={!!smokeDetected}
        />
        Smoke Detected
      </label>
      <label className="flex items-center mb-2 ml-2 text-gray-300 text-sm">
        <input
          type="checkbox"
          className="mr-2 accent-amber-500"
          onChange={() => {
            setShowTempAboveInput(!showTempAboveInput);
            setTempAbove(undefined);
          }}
          checked={showTempAboveInput}
        />
        Temp above
      </label>
      {showTempAboveInput && (
        <label className="flex items-center mb-2 ml-6 text-gray-300 text-sm">
          <input
            type="text"
            value={tempAbove ?? ""}
            className="mr-2 w-20 outline-none border border-gray-600 bg-gray-700 text-white rounded px-2 py-1 text-sm"
            onChange={(e) =>
              setTempAbove(
                e.target.value === "" ? undefined : Number(e.target.value),
              )
            }
          />
          &deg;C
        </label>
      )}
      <label className="flex items-center mb-2 ml-2 text-gray-300 text-sm">
        <input
          type="checkbox"
          className="mr-2 accent-amber-500"
          onChange={() => {
            setShowHumidityBelowInput(!showHumidityBelowInput);
            setHumidityBelow(undefined);
          }}
          checked={showHumidityBelowInput}
        />
        Humidity below
      </label>
      {showHumidityBelowInput && (
        <label className="flex items-center mb-2 ml-6 text-gray-300 text-sm">
          <input
            type="text"
            value={humidityBelow ?? ""}
            className="mr-2 w-20 outline-none border border-gray-600 bg-gray-700 text-white rounded px-2 py-1 text-sm"
            onChange={(e) =>
              setHumidityBelow(
                e.target.value === "" ? undefined : Number(e.target.value),
              )
            }
          />{" "}
          %
        </label>
      )}
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-1">Node Health</h3>
      <label className="flex items-center mb-1 ml-2 text-gray-300 text-sm">
        <input
          type="checkbox"
          className="mr-2 accent-amber-500"
          onChange={() => setLowBattery(!lowBattery)}
          checked={!!lowBattery}
        />
        Low battery (&lt; 20%)
      </label>
    </div>
  );
};

export default NodeFilter;
