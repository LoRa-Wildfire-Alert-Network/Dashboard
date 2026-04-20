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
      className={`px-3 py-1 rounded ${
        acknowledged ? "bg-green-500 text-white" : "bg-gray-300 text-gray-700"
      }`}
    >
      {acknowledged ? "Acknowledged" : "Acknowledge"}
    </button>
  );
};

export default AlertAckButton;
