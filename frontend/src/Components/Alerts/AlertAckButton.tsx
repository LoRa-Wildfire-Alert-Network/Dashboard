import React from "react";
import { useAuth } from "@clerk/clerk-react";

const AlertAckButton: React.FC<{
  alertId: number;
  acknowledged: boolean;
  onAckChange: (acknowledged: boolean) => void;
}> = ({ alertId, acknowledged, onAckChange }) => {
  const { getToken } = useAuth();
  const API_URL: string =
    import.meta.env.VITE_API_URL || "http://localhost:8000";

  const handleAckToggle = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/alerts/${alertId}/ack`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        onAckChange(!acknowledged);
      }
    } catch {
      alert("Failed to update alert acknowledgment status. Please try again.");
    }
  };

  return (
    <button
      onClick={handleAckToggle}
      className={`mt-1 px-3 py-1 rounded text-xs font-semibold border transition-colors ${
        acknowledged
          ? "bg-green-500/20 text-green-400 border-green-500/40"
          : "bg-amber-500 text-gray-900 border-amber-500 hover:bg-amber-400"
      }`}
    >
      {acknowledged ? "Acknowledged" : "Acknowledge"}
    </button>
  );
};

export default AlertAckButton;
