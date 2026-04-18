import { createContext, useContext } from "react";
import type { Permission } from "../types/rbacTypes";

export interface AuthCtx {
  orgId: string | null;
  orgName: string | null;
  orgRole: string | null;
  isOrgAdmin: boolean;
  permissions: Permission[];
  hasPermission: (p: Permission) => boolean;
}

const defaultCtx: AuthCtx = {
  orgId: null,
  orgName: null,
  orgRole: null,
  isOrgAdmin: false,
  permissions: [],
  hasPermission: () => true,
};

export const AuthContext = createContext<AuthCtx>(defaultCtx);
export const useAuthContext = () => useContext(AuthContext);
