import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useAuthContext } from "../../providers/AuthContext";
import type { OrgRole } from "../../types/rbacTypes";
import RoleManager from "./RoleManager";
import MemberManager from "./MemberManager";

interface OrgSettingsProps {
  onClose: () => void;
}

type Tab = "roles" | "members";

const OrgSettings: React.FC<OrgSettingsProps> = ({ onClose }) => {
  const { getToken } = useAuth();
  const { isOrgAdmin, orgId, orgName } = useAuthContext();
  const [tab, setTab] = useState<Tab>("roles");
  const [roles, setRoles] = useState<OrgRole[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const getAuthToken = async () => getToken();

  useEffect(() => {
    if (!isOrgAdmin || !orgId) return;
    (async () => {
      setLoadingRoles(true);
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/org/roles`, {
          headers: {
            Authorization: `Bearer ${token}`,
            ...(orgId ? { "X-Org-Id": orgId } : {}),
          },
        });
        if (res.ok) setRoles(await res.json());
      } finally {
        setLoadingRoles(false);
      }
    })();
  }, [orgId, isOrgAdmin, getToken, API_URL]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-[#0b0f0e] border border-neutral-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-neutral-800 shrink-0">
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1 font-medium">
              Organization Settings
            </p>
            <h2 className="text-xl font-bold text-white">
              {orgName ?? "Your Organization"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors text-2xl leading-none mt-0.5"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {!isOrgAdmin ? (
          <div className="p-8 text-center text-neutral-400">
            <p className="font-medium mb-1">Access Denied</p>
            <p className="text-sm">Only org admins can access settings.</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-1 px-6 pt-4 shrink-0">
              {(["roles", "members"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                    tab === t
                      ? "bg-neutral-800 text-white"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 text-white">
              {tab === "roles" && (
                loadingRoles ? (
                  <div className="text-neutral-500 py-8 text-center text-sm">Loading roles...</div>
                ) : (
                  <RoleManager
                    roles={roles}
                    onRoleCreated={(r) => setRoles((prev) => [...prev, r])}
                    onRoleUpdated={(r) => setRoles((prev) => prev.map((x) => x.id === r.id ? r : x))}
                    onRoleDeleted={(id) => setRoles((prev) => prev.filter((x) => x.id !== id))}
                    apiBaseUrl={API_URL}
                    orgId={orgId!}
                    getAuthToken={getAuthToken}
                  />
                )
              )}
              {tab === "members" && (
                <MemberManager
                  roles={roles}
                  apiBaseUrl={API_URL}
                  orgId={orgId!}
                  getAuthToken={getAuthToken}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OrgSettings;
