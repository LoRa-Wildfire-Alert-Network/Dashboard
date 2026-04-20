import React, { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import type { ShortNodeData } from "../../types/nodeTypes";
import CardLongData from "./CardLongData";
import CardShortData from "./CardShortData";
import { useAuthContext } from "../../providers/AuthContext";

interface NodeCardProps {
  nodeData: ShortNodeData;
  expandedNodeEuis: string[];
  onCardClick?: () => void;
  apiBaseUrl: string;
  subscribedNodeIds: string[];
  onSubscriptionsChange: (subs: string[]) => void;
}

const NodeCard: React.FC<NodeCardProps> = ({
  nodeData,
  expandedNodeEuis,
  onCardClick,
  apiBaseUrl,
  subscribedNodeIds,
  onSubscriptionsChange,
}) => {
  const [loading, setLoading] = useState(false);
  const isSubscribed = subscribedNodeIds.includes(nodeData.device_eui);

  const { getToken } = useAuth();
  const { hasPermission } = useAuthContext();
  const canSubscribe = hasPermission("subscribe_nodes");
  const handleToggle = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    const optimisticSubs = isSubscribed
      ? subscribedNodeIds.filter((id) => id !== nodeData.device_eui)
      : [...subscribedNodeIds, nodeData.device_eui];
    onSubscriptionsChange(optimisticSubs);
    setLoading(true);
    try {
      const token = await getToken();
      const action = isSubscribed ? "unsubscribe" : "subscribe";
      await fetch(`${apiBaseUrl}/subscriptions/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ device_eui: nodeData.device_eui }),
      });
    } catch {
      // Revert on error
      onSubscriptionsChange(subscribedNodeIds);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex flex-row items-center justify-center bg-slate-700 text-white rounded-md my-2 p-2 hover:cursor-pointer"
      onClick={onCardClick}
    >
      {expandedNodeEuis.includes(nodeData.device_eui) ? (
        <CardLongData
          nodeData={nodeData}
          onClick={handleToggle}
          loading={loading}
          canSubscribe={canSubscribe}
          isSubscribed={isSubscribed}
        />
      ) : (
        <CardShortData nodeData={nodeData} />
      )}
    </div>
  );
};

export default NodeCard;
