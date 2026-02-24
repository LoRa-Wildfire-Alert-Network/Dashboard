import { createContext, useContext } from "react";

export interface AuthCtx {
  orgId: string | null;
  orgName: string | null;
}

export const AuthContext = createContext<AuthCtx>({ orgId: null, orgName: null });
export const useAuthContext = () => useContext(AuthContext);
