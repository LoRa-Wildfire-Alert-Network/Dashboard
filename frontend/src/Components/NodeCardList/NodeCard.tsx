import NodeSubscriptionButton from "../NodeSubscriptionModal/NodeSubscriptionButton";
import React, { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import type { NodeData } from "../../types/nodeTypes";
import CardLongData from "./CardLongData";
import CardShortData from "./CardShortData";

interface NodeCardProps {
  nodeData: NodeData;
  expandedNodeIds: string[];
  onCardClick?: () => void;
  apiBaseUrl: string;
  subscribedNodeIds: string[];
  onSubscriptionsChange: (subs: string[]) => void;
}

const NodeCard: React.FC<NodeCardProps> = ({
  nodeData,
  expandedNodeIds,
  onCardClick,
  apiBaseUrl,
  subscribedNodeIds,
  onSubscriptionsChange,
}) => {
  const [loading, setLoading] = useState(false);
  const isSubscribed = subscribedNodeIds.includes(nodeData.device_eui);

  const { getToken } = useAuth();
  const handleToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setLoading(true);
    try {
      const token = await getToken();
      let newSubs;
      if (isSubscribed) {
        await fetch(`${apiBaseUrl}/subscriptions/unsubscribe`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ device_eui: nodeData.device_eui }),
        });
        newSubs = subscribedNodeIds.filter((id) => id !== nodeData.device_eui);
      } else {
        await fetch(`${apiBaseUrl}/subscriptions/subscribe`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ device_eui: nodeData.device_eui }),
        });
        newSubs = [...subscribedNodeIds, nodeData.device_eui];
      }
      onSubscriptionsChange(newSubs);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex flex-row items-center justify-center bg-slate-700 text-white rounded-md my-2 p-2 hover:cursor-pointer"
      onClick={onCardClick}
    >
      <input
        type="checkbox"
        checked={isSubscribed}
        onChange={handleToggle}
        disabled={loading}
        style={{ marginRight: 8 }}
        onClick={(e) => e.stopPropagation()}
      />
      {expandedNodeIds.includes(nodeData.device_eui) ? (
        <CardLongData nodeData={nodeData} />
      ) : (
        <CardShortData nodeData={nodeData} />
      )}
    </div>
  );
};

export default NodeCard;
