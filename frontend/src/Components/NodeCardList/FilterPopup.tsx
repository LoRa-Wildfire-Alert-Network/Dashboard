import React from "react";

interface FilterPopupProps {
  onClickAlert: () => void;
  onClickWarning: () => void;
  onClickNormal: () => void;
  showAlertNodes: boolean;
  showWarningNodes: boolean;
  showNormalNodes: boolean;
}

const FilterPopup: React.FC<FilterPopupProps> = ({
  onClickAlert,
  onClickWarning,
  onClickNormal,
  showAlertNodes,
  showWarningNodes,
  showNormalNodes,
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
          defaultChecked={showAlertNodes}
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
          defaultChecked={showWarningNodes}
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
          defaultChecked={showNormalNodes}
        />
        Show Normal Nodes
      </label>
    </div>
  );
};

export default FilterPopup;
