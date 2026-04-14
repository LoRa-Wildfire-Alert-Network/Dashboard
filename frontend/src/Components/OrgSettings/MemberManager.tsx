import React, { useEffect, useState } from "react";
import type { OrgMember, OrgRole } from "../../types/rbacTypes";

interface MemberManagerProps {
  roles: OrgRole[];
  apiBaseUrl: string;
  orgId: string;
  getAuthToken: () => Promise<string | null>;
}

const MemberManager: React.FC<MemberManagerProps> = ({ roles, apiBaseUrl, orgId, getAuthToken }) => {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const authHeaders = async () => {
    const token = await getAuthToken();
    return { Authorization: `Bearer ${token}`, "X-Org-Id": orgId };
  };

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${apiBaseUrl}/org/members`, { headers });
      if (!res.ok) throw new Error((await res.json()).detail ?? "Failed to load members");
      setMembers(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleRoleChange = async (member: OrgMember, roleId: string) => {
    setSaving(member.user_id);
    try {
      const headers = await authHeaders();
      if (roleId === "") {
        const res = await fetch(`${apiBaseUrl}/org/members/${member.user_id}/role`, {
          method: "DELETE",
          headers,
        });
        if (!res.ok) throw new Error((await res.json()).detail ?? "Failed to remove role");
        setMembers((prev) =>
          prev.map((m) => m.user_id === member.user_id ? { ...m, assigned_role: null } : m)
        );
      } else {
        const res = await fetch(`${apiBaseUrl}/org/members/${member.user_id}/role`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify({ role_id: parseInt(roleId) }),
        });
        if (!res.ok) throw new Error((await res.json()).detail ?? "Failed to assign role");
        const newRole = roles.find((r) => r.id === parseInt(roleId)) ?? null;
        setMembers((prev) =>
          prev.map((m) => m.user_id === member.user_id ? { ...m, assigned_role: newRole } : m)
        );
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to update role");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return <div className="text-neutral-500 py-8 text-center text-sm">Loading members…</div>;
  }
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide">Members</h3>
        <button
          className="text-xs text-neutral-400 hover:text-white transition-colors"
          onClick={fetchMembers}
        >
          Refresh
        </button>
      </div>

      {members.length === 0 ? (
        <p className="text-neutral-500 text-sm">No members found.</p>
      ) : (
        <div className="space-y-2">
          {members.map((member) => (
            <div key={member.user_id} className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white text-sm truncate">
                    {member.name || member.email}
                  </span>
                  {member.clerk_role === "org:admin" && (
                    <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded shrink-0">
                      admin
                    </span>
                  )}
                </div>
                {member.name && (
                  <p className="text-neutral-500 text-xs truncate">{member.email}</p>
                )}
              </div>

              <div className="shrink-0">
                {member.clerk_role === "org:admin" ? (
                  <span className="text-xs text-neutral-600 italic">Full access</span>
                ) : (
                  <select
                    className="bg-neutral-800 text-white text-sm rounded-lg px-2.5 py-1.5 border border-neutral-700 focus:outline-none focus:border-orange-500 transition-colors disabled:opacity-40"
                    value={member.assigned_role?.id?.toString() ?? ""}
                    onChange={(e) => handleRoleChange(member, e.target.value)}
                    disabled={saving === member.user_id || roles.length === 0}
                  >
                    <option value="">— No role —</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id.toString()}>
                        {role.name}{role.is_default ? " (default)" : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {roles.length === 0 && members.length > 0 && (
        <p className="text-neutral-600 text-xs mt-3">
          Create roles in the Roles tab before assigning them to members.
        </p>
      )}
    </div>
  );
};

export default MemberManager;
