import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import NodeSubscriptionModal from "../NodeSubscriptionModal/NodeSubscriptionModal";

interface NodeSubscriptionButtonProps {
  apiBaseUrl: string;
  onSubscriptionsChange: (subs: string[]) => void;
}

const NodeSubscriptionButton: React.FC<NodeSubscriptionButtonProps> = ({ apiBaseUrl, onSubscriptionsChange }) => {
  const { getToken } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
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
    if (modalOpen) fetchSubscriptions();
  }, [modalOpen, apiBaseUrl, getToken, onSubscriptionsChange]);

  const handleUpdate = (newSubs: string[]) => {
    setSubscribedNodeIds(newSubs);
    onSubscriptionsChange(newSubs);
  };

  return (
    <>
      <button
        className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-800 text-white font-semibold mb-2"
        onClick={() => setModalOpen(true)}
        disabled={loading}
      >
        {loading ? "Loading..." : "Subscriptions"}
      </button>
      <NodeSubscriptionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        subscribedNodeIds={subscribedNodeIds}
        onUpdate={handleUpdate}
        apiBaseUrl={apiBaseUrl}
        getAuthToken={async () => {
          const token = await getToken();
          if (!token) throw new Error("No auth token returned");
          return token;
        }}
      />
    </>
  );
};

export default NodeSubscriptionButton;
