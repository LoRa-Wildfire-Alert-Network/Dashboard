import React, { useState } from "react";
import type { OrgRole, Permission } from "../../types/rbacTypes";
import { ALL_PERMISSIONS } from "../../types/rbacTypes";

const PERM_LABELS: Record<Permission, string> = {
  view_nodes: "View nodes & telemetry",
  subscribe_nodes: "Subscribe to nodes",
};

interface RoleManagerProps {
  roles: OrgRole[];
  onRoleCreated: (role: OrgRole) => void;
  onRoleUpdated: (role: OrgRole) => void;
  onRoleDeleted: (roleId: number) => void;
  apiBaseUrl: string;
  orgId: string;
  getAuthToken: () => Promise<string | null>;
}

interface RoleFormState {
  name: string;
  description: string;
  is_default: boolean;
  permissions: Set<Permission>;
}

const emptyForm = (): RoleFormState => ({
  name: "",
  description: "",
  is_default: false,
  permissions: new Set(),
});

const RoleManager: React.FC<RoleManagerProps> = ({
  roles,
  onRoleCreated,
  onRoleUpdated,
  onRoleDeleted,
  apiBaseUrl,
  orgId,
  getAuthToken,
}) => {
  const [editing, setEditing] = useState<OrgRole | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<RoleFormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authHeaders = async () => {
    const token = await getAuthToken();
    return {
      Authorization: `Bearer ${token}`,
      "X-Org-Id": orgId,
    };
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setError(null);
    setShowForm(true);
  };

  const openEdit = (role: OrgRole) => {
    setEditing(role);
    setForm({
      name: role.name,
      description: role.description ?? "",
      is_default: role.is_default,
      permissions: new Set(role.permissions),
    });
    setError(null);
    setShowForm(true);
  };

  const togglePerm = (p: Permission) => {
    setForm((prev) => {
      const next = new Set(prev.permissions);
      if (next.has(p)) { next.delete(p); } else { next.add(p); }
      return { ...prev, permissions: next };
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Role name is required"); return; }
    setSaving(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const body = {
        name: form.name.trim(),
        description: form.description || null,
        is_default: form.is_default,
        permissions: Array.from(form.permissions),
      };

      if (editing) {
        const res = await fetch(`${apiBaseUrl}/org/roles/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify({ name: body.name, description: body.description, is_default: body.is_default }),
        });
        if (!res.ok) throw new Error((await res.json()).detail ?? "Failed to update role");
        const updated: OrgRole = await res.json();

        // Sync permissions: add new, remove deleted
        const existing = new Set(editing.permissions);
        const desired = new Set(form.permissions);
        for (const p of desired) {
          if (!existing.has(p)) {
            await fetch(`${apiBaseUrl}/org/roles/${editing.id}/permissions/${p}`, {
              method: "POST",
              headers,
            });
          }
        }
        for (const p of existing) {
          if (!desired.has(p)) {
            await fetch(`${apiBaseUrl}/org/roles/${editing.id}/permissions/${p}`, {
              method: "DELETE",
              headers,
            });
          }
        }
        onRoleUpdated({ ...updated, permissions: Array.from(desired) });
      } else {
        const res = await fetch(`${apiBaseUrl}/org/roles`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error((await res.json()).detail ?? "Failed to create role");
        onRoleCreated(await res.json());
      }
      setShowForm(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role: OrgRole) => {
    if (!confirm(`Delete role "${role.name}"?`)) return;
    try {
      const headers = await authHeaders();
      const res = await fetch(`${apiBaseUrl}/org/roles/${role.id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) {
        alert((await res.json()).detail ?? "Failed to delete role");
        return;
      }
      onRoleDeleted(role.id);
    } catch {
      alert("Failed to delete role");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide">Roles</h3>
        <button
          className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
          onClick={openCreate}
        >
          + New Role
        </button>
      </div>

      {roles.length === 0 && (
        <p className="text-neutral-500 text-sm">
          No roles yet. Create one to assign permissions to members.
        </p>
      )}

      <div className="space-y-2">
        {roles.map((role) => (
          <div key={role.id} className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white text-sm">{role.name}</span>
                {role.is_default && (
                  <span className="text-xs bg-orange-500/15 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded">
                    default
                  </span>
                )}
              </div>
              {role.description && (
                <p className="text-neutral-500 text-xs mt-0.5">{role.description}</p>
              )}
              <div className="flex flex-wrap gap-1 mt-2">
                {role.permissions.length === 0 ? (
                  <span className="text-xs text-neutral-600 italic">No permissions</span>
                ) : (
                  role.permissions.map((p) => (
                    <span key={p} className="text-xs bg-neutral-800 text-neutral-300 border border-neutral-700 px-2 py-0.5 rounded">
                      {PERM_LABELS[p] ?? p}
                    </span>
                  ))
                )}
              </div>
            </div>
            <div className="flex gap-3 shrink-0">
              <button className="text-xs text-neutral-400 hover:text-white transition-colors" onClick={() => openEdit(role)}>
                Edit
              </button>
              <button className="text-xs text-red-500 hover:text-red-400 transition-colors" onClick={() => handleDelete(role)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Role form modal */}
      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0b0f0e] border border-neutral-800 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">
                {editing ? "Edit Role" : "New Role"}
              </h3>
              <button className="text-neutral-400 hover:text-white text-xl" onClick={() => setShowForm(false)}>×</button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-400 text-sm mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5 font-medium uppercase tracking-wide">Name *</label>
                <input
                  className="w-full bg-neutral-900 text-white rounded-lg px-3 py-2 text-sm border border-neutral-700 focus:outline-none focus:border-orange-500 transition-colors"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Viewer, Operator"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1.5 font-medium uppercase tracking-wide">Description</label>
                <input
                  className="w-full bg-neutral-900 text-white rounded-lg px-3 py-2 text-sm border border-neutral-700 focus:outline-none focus:border-orange-500 transition-colors"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-2 font-medium uppercase tracking-wide">Permissions</label>
                <div className="space-y-2">
                  {ALL_PERMISSIONS.map((p) => (
                    <label key={p} className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={form.permissions.has(p)}
                        onChange={() => togglePerm(p)}
                        className="h-4 w-4 accent-orange-500"
                      />
                      <span className="text-sm text-neutral-300 group-hover:text-white transition-colors">
                        {PERM_LABELS[p]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))}
                  className="h-4 w-4 accent-orange-500"
                />
                <span className="text-sm text-neutral-300 group-hover:text-white transition-colors">
                  Default role (auto-assigned to new members)
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-sm transition-colors"
                onClick={() => setShowForm(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManager;
