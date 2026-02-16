import React, { useEffect, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckSquare, faSquare } from "@fortawesome/free-regular-svg-icons";

interface Node {
  node_id: string;
  device_eui: string;
  last_seen?: string;
}

interface NodeSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscribedNodeIds: string[];
  onUpdate: (newSubscriptions: string[]) => void;
  apiBaseUrl: string;
  getAuthToken: () => Promise<string>;
}

const NodeSubscriptionModal: React.FC<NodeSubscriptionModalProps> = ({
  isOpen,
  onClose,
  subscribedNodeIds,
  onUpdate,
  apiBaseUrl,
  getAuthToken,
}) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set(subscribedNodeIds));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    (async () => {
      try {
        const token = await getAuthToken();
        const res = await axios.get(`${apiBaseUrl}/nodes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNodes(res.data);
      } catch {
        setError("Failed to load nodes.");
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, apiBaseUrl, getAuthToken]);

  useEffect(() => {
    setSelected(new Set(subscribedNodeIds));
  }, [subscribedNodeIds, isOpen]);

  const handleToggle = (deviceEui: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(deviceEui)) {
        next.delete(deviceEui);
      } else {
        next.add(deviceEui);
      }
      return next;
    });
  };
  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAuthToken();
      // Subscribe to new nodes
      for (const deviceEui of selected) {
        if (!subscribedNodeIds.includes(deviceEui)) {
          await axios.post(
            `${apiBaseUrl}/subscriptions/subscribe`,
            { device_eui: deviceEui },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      }
      // Unsubscribe from removed nodes
      for (const deviceEui of subscribedNodeIds) {
        if (!selected.has(deviceEui)) {
          await axios.post(
            `${apiBaseUrl}/subscriptions/unsubscribe`,
            { device_eui: deviceEui },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      }
      onUpdate(Array.from(selected));
      onClose();
    } catch {
      setError("Failed to update subscriptions.");
    } finally {
      setLoading(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-auto bg-transparent">
      <div className="bg-slate-700 text-white rounded-lg shadow-lg w-full max-w-lg p-6 relative z-[1001]">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Nodes</h2>
        </div>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : error ? (
          <div className="text-red-500 mb-4">{error}</div>
        ) : (
          <ul className="max-h-64 overflow-y-auto divide-y divide-gray-200 mb-4">
            <li className="flex items-center py-2">
              <button
                className="mr-3 h-5 w-5 text-slate-400 rounded focus:outline-none"
                title={selected.size === nodes.length ? "Deselect All" : "Select All"}
                onClick={() => {
                  if (selected.size === nodes.length) {
                    setSelected(new Set());
                  } else {
                    setSelected(new Set(nodes.map(n => n.device_eui)));
                  }
                }}
              >
                <FontAwesomeIcon icon={selected.size === nodes.length ? faSquare : faCheckSquare} size="lg" />
              </button>
              <span className="text-sm font-semibold">{selected.size === nodes.length ? "Deselect All" : "Select All"}</span>
            </li>
            {nodes.map((node) => (
              <li key={node.device_eui} className="flex items-center py-2">
                <input
                  type="checkbox"
                  checked={selected.has(node.device_eui)}
                  onChange={() => handleToggle(node.device_eui)}
                  className="mr-3 h-5 w-5 text-slate-400 rounded"
                  id={`node-${node.device_eui}`}
                />
                <label htmlFor={`node-${node.device_eui}`} className="flex-1 cursor-pointer">
                  <span className="font-mono text-sm">{node.device_eui}</span>
                  {node.node_id && (
                    <span className="ml-2 text-gray-500 text-xs">({node.node_id})</span>
                  )}
                </label>
              </li>
            ))}
          </ul>
        )}
        <div className="flex justify-end space-x-2">
          <button
            className="px-4 py-2 rounded bg-slate-400 hover:bg-slate-500 text-white"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-slate-500 hover:bg-slate-600 text-white font-semibold"
            onClick={handleSave}
            disabled={loading}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default NodeSubscriptionModal;
