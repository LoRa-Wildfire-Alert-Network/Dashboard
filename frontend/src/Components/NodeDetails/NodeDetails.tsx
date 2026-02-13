import { useState, useEffect } from "react";
import type { DetailNodeData } from "../../types/nodeTypes";

const NodeDetails: React.FC<{ nodeId: string | null }> = ({ nodeId }) => {
  const [nodeData, setNodeData] = useState<DetailNodeData | null>(null);

  const API_URL: string =
    import.meta.env.VITE_API_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchNodeData = async () => {
      if (!nodeId) {
        setNodeData(null);
        return;
      }
      try {
        const response = await fetch(`${API_URL}/nodes/${nodeId}/latest`);
        const data = await response.json();
        console.log(data);
        setNodeData(data);
      } catch (error) {
        console.error("Error fetching node data:", error);
      }
    };

    fetchNodeData();
    const interval = setInterval(fetchNodeData, 3000);
    return () => clearInterval(interval);
  }, [API_URL, nodeId]);

  return (
    <div className="flex-none lg:w-80 md:w-48 bg-slate-100 rounded-md p-4">
      <h2 className="text-lg font-bold mb-2">Node: {nodeId}</h2>
      {nodeId && nodeData && (
        <pre className="whitespace-pre-wrap">
          {JSON.stringify(nodeData, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default NodeDetails;
