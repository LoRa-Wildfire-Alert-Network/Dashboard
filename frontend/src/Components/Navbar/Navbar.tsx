import { useState } from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
  OrganizationSwitcher,
} from "@clerk/clerk-react";
import { withGoto } from "../../lib/goto";
import OrgPermissionsPage from "../OrgSettings/OrgPermissionsPage";
import { useAuthContext } from "../../providers/AuthContext";

const DOCS_URL = import.meta.env.VITE_DOCS_URL ?? "/docs/";

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isOrgAdmin } = useAuthContext();

  return (
    <div className="relative">
      <div className="flex justify-between items-center w-full h-16 bg-slate-600">
        {/* Left: hamburger on mobile, docs on md+ */}
        <div className="flex items-center gap-6 p-4">
          <button
            aria-label="Toggle menu"
            className="text-white md:hidden"
            onClick={() => setMobileMenuOpen((s) => !s)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <a
            href={DOCS_URL}
            target={DOCS_URL.startsWith("http") ? "_blank" : undefined}
            rel={DOCS_URL.startsWith("http") ? "noopener noreferrer" : undefined}
            className="hidden md:inline text-white/90 text-base hover:text-white hover:underline"
          >
            Docs
          </a>
        </div>

        {/* Center: title */}
        <p className="text-white text-lg font-semibold">LoRa Dashboard</p>

        {/* Right: user actions */}
        <div className="flex items-center gap-4 p-4">
          <div className="hidden md:flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-white text-lg font-semibold hover:underline hover:cursor-pointer">Sign In</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="text-white text-lg font-semibold hover:underline hover:cursor-pointer">Sign Up</button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <OrganizationSwitcher
                hidePersonal={false}
                appearance={{
                  elements: {
                    rootBox: "flex items-center",
                    organizationSwitcherTrigger: "text-white",
                  },
                }}
              >
                {isOrgAdmin && (
                  <OrganizationSwitcher.OrganizationProfilePage
                    label="Permissions"
                    url="permissions"
                    labelIcon={<ShieldIcon />}
                  >
                    <OrgPermissionsPage />
                  </OrganizationSwitcher.OrganizationProfilePage>
                )}
              </OrganizationSwitcher>
            </SignedIn>
          </div>
          <SignedIn>
            <UserButton afterSignOutUrl={withGoto("/")} />
          </SignedIn>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute left-0 right-0 bg-slate-700 text-white z-40">
          <div className="flex flex-col p-4 gap-3">
            <SignedIn>
              <div className="flex items-center">
                <OrganizationSwitcher
                  hidePersonal={false}
                  appearance={{
                    elements: {
                      rootBox: "flex items-center",
                      organizationSwitcherTrigger: "text-white",
                    },
                  }}
                >
                  {isOrgAdmin && (
                    <OrganizationSwitcher.OrganizationProfilePage
                      label="Permissions"
                      url="permissions"
                      labelIcon={<ShieldIcon />}
                    >
                      <OrgPermissionsPage />
                    </OrganizationSwitcher.OrganizationProfilePage>
                  )}
                </OrganizationSwitcher>
              </div>
            </SignedIn>
            <a
              href={DOCS_URL}
              target={DOCS_URL.startsWith("http") ? "_blank" : undefined}
              rel={DOCS_URL.startsWith("http") ? "noopener noreferrer" : undefined}
              className="text-base hover:underline"
              onClick={() => setMobileMenuOpen(false)}
            >
              Docs
            </a>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-base text-left hover:underline" onClick={() => setMobileMenuOpen(false)}>Sign In</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="text-base text-left hover:underline" onClick={() => setMobileMenuOpen(false)}>Sign Up</button>
              </SignUpButton>
            </SignedOut>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
