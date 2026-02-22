import { useEffect, useRef, createContext, useContext } from "react";
import { useAuth, useOrganization } from "@clerk/clerk-react";
import { broadcastSignIn, onAuthMessage } from "../lib/broadcast";
import { getGoto, storeGoto, clearGoto } from "../lib/goto";

interface AuthCtx {
  orgId: string | null;
  orgName: string | null;
}

const AuthContext = createContext<AuthCtx>({ orgId: null, orgName: null });
export const useAuthContext = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  const { organization } = useOrganization();
  const prevSignedIn = useRef<boolean | undefined>(undefined);

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
    orgId: organization?.id ?? null,
    orgName: organization?.name ?? null,
  };

  return <AuthContext.Provider value={ctx}>{children}</AuthContext.Provider>;
}
