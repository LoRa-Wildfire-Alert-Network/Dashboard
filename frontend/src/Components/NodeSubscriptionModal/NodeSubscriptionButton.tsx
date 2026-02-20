import React, { useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";

interface NodeSubscriptionButtonProps {
  apiBaseUrl: string;
  onSubscriptionsChange: (subs: string[]) => void;
}

const NodeSubscriptionButton: React.FC<NodeSubscriptionButtonProps> = ({ apiBaseUrl, onSubscriptionsChange }) => {
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${apiBaseUrl}/subscriptions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        onSubscriptionsChange(Array.isArray(data) ? data : []);
      } catch {
        // ignore
      }
    };
    fetchSubscriptions();
  }, [apiBaseUrl, getToken, onSubscriptionsChange]);

  return null;
};

export default NodeSubscriptionButton;
