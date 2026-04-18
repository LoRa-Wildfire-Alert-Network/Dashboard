import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth, useOrganization } from "@clerk/clerk-react";
import { broadcastSignIn, onAuthMessage } from "../lib/broadcast";
import { getGoto, storeGoto, clearGoto } from "../lib/goto";
import { AuthContext, type AuthCtx } from "./AuthContext";
import type { Permission } from "../types/rbacTypes";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, getToken } = useAuth();
  const { organization, membership } = useOrganization();
  const prevSignedIn = useRef<boolean | undefined>(undefined);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  const orgId = organization?.id ?? null;
  const orgRole = (membership?.role as string) ?? null;
  const isOrgAdmin = orgRole === "org:admin";

  const fetchPermissions = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) { setPermissions([]); return; }
      const res = await fetch(`${API_URL}/org/me/permissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
          ...(orgId ? { "X-Org-Id": orgId } : {}),
        },
      });
      if (!res.ok) { setPermissions([]); return; }
      const data = await res.json();
      setPermissions(Array.isArray(data.permissions) ? data.permissions : []);
    } catch {
      setPermissions([]);
    }
  }, [getToken, orgId]);

  // fetch permissions whenever org context or sign-in state changes
  useEffect(() => {
    if (isSignedIn) {
      fetchPermissions();
    } else {
      setPermissions([]);
    }
  }, [isSignedIn, orgId, orgRole, fetchPermissions]);

  useEffect(() => {
    const prev = prevSignedIn.current;
    prevSignedIn.current = isSignedIn ?? false;
    if (prev === undefined) return;

    if (prev === true && isSignedIn === false) {
      storeGoto();
    }

    // restore goto URL and notify other tabs
    if (prev === false && isSignedIn === true) {
      const goto = getGoto();
      clearGoto();
      broadcastSignIn();
      if (goto && goto !== window.location.pathname + window.location.search) {
        window.location.replace(goto);
      }
    }
  }, [isSignedIn]);

  // listen for sign-in from another tab
  useEffect(() => {
    return onAuthMessage((msg) => {
      if (msg.type === "signed-in" && !isSignedIn) {
        window.location.reload();
      }
    });
  }, [isSignedIn]);

  const ctx: AuthCtx = {
    orgId,
    orgName: organization?.name ?? null,
    orgRole,
    isOrgAdmin,
    permissions,
    hasPermission: (p: Permission) => !orgId || permissions.includes(p),
  };

  return <AuthContext.Provider value={ctx}>{children}</AuthContext.Provider>;
}
