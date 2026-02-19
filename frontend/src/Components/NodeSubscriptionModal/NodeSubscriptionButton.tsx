import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";

interface NodeSubscriptionButtonProps {
  apiBaseUrl: string;
  onSubscriptionsChange: (subs: string[]) => void;
}

const NodeSubscriptionButton: React.FC<NodeSubscriptionButtonProps> = ({ apiBaseUrl, onSubscriptionsChange }) => {
  const { getToken } = useAuth();
  const [subscribedNodeIds, setSubscribedNodeIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const res = await fetch(`${apiBaseUrl}/subscriptions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setSubscribedNodeIds(Array.isArray(data) ? data : []);
        onSubscriptionsChange(Array.isArray(data) ? data : []);
      } catch {
        setSubscribedNodeIds([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSubscriptions();
  }, [apiBaseUrl, getToken, onSubscriptionsChange]);

  const handleToggle = async (deviceEui: string) => {
    setLoading(true);
    try {
      const token = await getToken();
      let newSubs;
      if (subscribedNodeIds.includes(deviceEui)) {
        await fetch(`${apiBaseUrl}/subscriptions/unsubscribe`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ device_eui: deviceEui }),
        });
        newSubs = subscribedNodeIds.filter((id) => id !== deviceEui);
      } else {
        await fetch(`${apiBaseUrl}/subscriptions/subscribe`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ device_eui: deviceEui }),
        });
        newSubs = [...subscribedNodeIds, deviceEui];
      }
      setSubscribedNodeIds(newSubs);
      onSubscriptionsChange(newSubs);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return null;
};

export default NodeSubscriptionButton;
