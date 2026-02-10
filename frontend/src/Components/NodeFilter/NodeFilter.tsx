import React from "react";

interface NodeFilterProps {
  onClickAlert: () => void;
  onClickWarning: () => void;
  onClickNormal: () => void;
  nodeFilter: string[];
}

const NodeFilter: React.FC<NodeFilterProps> = ({
  onClickAlert,
  onClickWarning,
  onClickNormal,
  nodeFilter,
}) => {
  return (
    <div className="flex flex-col bg-white p-4 rounded shadow-lg">
      <h2 className="text-lg font-bold mb-2">Filter Options</h2>
      <label className="flex items-center mb-2">
        <input
          type="checkbox"
          className="mr-2"
          onClick={() => {
            onClickAlert();
          }}
          defaultChecked={nodeFilter.includes("alert")}
        />
        Show Alert Nodes
      </label>
      <label className="flex items-center mb-2">
        <input
          type="checkbox"
          className="mr-2"
          onClick={() => {
            onClickWarning();
          }}
          defaultChecked={nodeFilter.includes("warning")}
        />
        Show Warning Nodes
      </label>
      <label className="flex items-center mb-2">
        <input
          type="checkbox"
          className="mr-2"
          onClick={() => {
            onClickNormal();
          }}
          defaultChecked={nodeFilter.includes("normal")}
        />
        Show Normal Nodes
      </label>
      <h3 className="text-lg font-bold mb-2">Alerts</h3>
      <label className="flex items-center mb-2 ml-4">
        <input type="checkbox" className="mr-2" />
        Smoke Detected
      </label>
      <label className="flex items-center mb-2 ml-4">
        <input type="checkbox" className="mr-2" />
        Temp Above 100C
      </label>
      <label className="flex items-center mb-2 ml-4">
        <input type="checkbox" className="mr-2" />
        Humidity below 15%
      </label>
      <h3 className="text-lg font-bold mb-2">Node Health</h3>
      <label className="flex items-center mb-2 ml-4">
        <input type="checkbox" className="mr-2" />
        Low battery (&lt; 20%)
      </label>
      <label className="flex items-center mb-2 ml-4">
        <input type="checkbox" className="mr-2" />
        Smoke Detected
      </label>
    </div>
  );
};

export default NodeFilter;
