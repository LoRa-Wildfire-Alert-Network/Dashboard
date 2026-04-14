import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useAuthContext } from "../../providers/AuthContext";
import type { Permission } from "../../types/rbacTypes";
import { ALL_PERMISSIONS } from "../../types/rbacTypes";

const PERM_LABELS: Record<Permission, string> = {
  view_nodes: "View nodes & telemetry",
  subscribe_nodes: "Subscribe to nodes",
};

const PERM_DESCRIPTIONS: Record<Permission, string> = {
  view_nodes: "Can see sensor nodes, live telemetry, map, and historical data.",
  subscribe_nodes: "Can subscribe and unsubscribe to sensor nodes.",
};

const CONFIGURABLE_ROLES = [
  { slug: "org:member", label: "Member" },
];

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const OrgPermissionsPage: React.FC = () => {
  const { getToken } = useAuth();
  const { orgId } = useAuthContext();
  const [settings, setSettings] = useState<Record<string, Set<Permission>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedRole, setSavedRole] = useState<string | null>(null);
  const authHeaders = useCallback(async () => {
    const token = await getToken();
    return {
      Authorization: `Bearer ${token}`,
      ...(orgId ? { "X-Org-Id": orgId } : {}),
    };
  }, [getToken, orgId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const headers = await authHeaders();
        const res = await fetch(`${API_URL}/org/role-settings`, { headers });
        if (!res.ok) throw new Error((await res.json()).detail ?? "Failed to load settings");
        const data: Record<string, string[]> = await res.json();
        const mapped: Record<string, Set<Permission>> = {};
        for (const [role, perms] of Object.entries(data)) {
          mapped[role] = new Set(perms as Permission[]);
        }
        setSettings(mapped);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load settings");
      } finally {
        setLoading(false);
      }
    })();
  }, [orgId, authHeaders]);

  const togglePerm = (roleSlug: string, perm: Permission) => {
    setSettings((prev) => {
      const current = new Set(prev[roleSlug] ?? []);
      current.has(perm) ? current.delete(perm) : current.add(perm);
      return { ...prev, [roleSlug]: current };
    });
  };

  const saveRole = async (roleSlug: string) => {
    setSaving(roleSlug);
    setError(null);
    try {
      const headers = await authHeaders();
      const perms = Array.from(settings[roleSlug] ?? []);
      const res = await fetch(`${API_URL}/org/role-settings/${roleSlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ permissions: perms }),
      });
      if (!res.ok) throw new Error((await res.json()).detail ?? "Failed to save");
      setSavedRole(roleSlug);
      setTimeout(() => setSavedRole(null), 2000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save settings");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-sm text-gray-400">
        Loading permission settings…
      </div>
    );
  }

  return (
    <div className="p-1">
      <p className="text-sm text-gray-500 mb-6">
        Configure what each member role is allowed to do in this organization.
        Admins always have full access.
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-red-400 text-sm">
          {error}
        </div>
      )}

      {CONFIGURABLE_ROLES.map(({ slug, label }) => (
        <div key={slug} className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">{label}</h3>
            <button
              onClick={() => saveRole(slug)}
              disabled={saving === slug}
              className="px-3 py-1 rounded-md bg-[#f97316] hover:bg-orange-600 text-white text-xs font-medium transition-colors disabled:opacity-50"
            >
              {saving === slug ? "Saving…" : savedRole === slug ? "Saved ✓" : "Save"}
            </button>
          </div>

          <div className="space-y-3">
            {ALL_PERMISSIONS.map((perm) => {
              const checked = settings[slug]?.has(perm) ?? false;
              return (
                <label
                  key={perm}
                  className="flex items-start gap-3 cursor-pointer group rounded-lg p-2 hover:bg-gray-100/5 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => togglePerm(slug, perm)}
                    className="mt-0.5 h-4 w-4 accent-orange-500 shrink-0"
                  />
                  <div>
                    <p className="text-sm font-medium leading-tight">{PERM_LABELS[perm]}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{PERM_DESCRIPTIONS[perm]}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrgPermissionsPage;
