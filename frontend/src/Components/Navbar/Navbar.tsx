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

const DOCS_URL = import.meta.env.VITE_DOCS_URL ?? "/docs/";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <a
            href={DOCS_URL}
            target={DOCS_URL.startsWith("http") ? "_blank" : undefined}
            rel={
              DOCS_URL.startsWith("http") ? "noopener noreferrer" : undefined
            }
            className="hidden md:inline text-white/90 text-base hover:text-white hover:underline"
          >
            Docs
          </a>
        </div>

        {/* Center: title */}
        <p className="text-white text-lg font-semibold">LoRa Dashboard</p>

        {/* Right: user actions; on mobile show only UserButton, other actions are in dropdown */}
        <div className="flex items-center gap-4 p-4">
          <div className="hidden md:flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-white text-lg font-semibold hover:underline hover:cursor-pointer">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="text-white text-lg font-semibold hover:underline hover:cursor-pointer">
                  Sign Up
                </button>
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
              />
            </SignedIn>
          </div>
          <SignedIn>
            <UserButton afterSignOutUrl={withGoto("/")} />
          </SignedIn>
        </div>
      </div>

      {/* Mobile dropdown/menu (only visible on small screens) */}
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
                />
              </div>
            </SignedIn>

            <a
              href={DOCS_URL}
              target={DOCS_URL.startsWith("http") ? "_blank" : undefined}
              rel={
                DOCS_URL.startsWith("http") ? "noopener noreferrer" : undefined
              }
              className="text-base hover:underline"
              onClick={() => setMobileMenuOpen(false)}
            >
              Docs
            </a>

            <SignedOut>
              <SignInButton mode="modal">
                <button
                  className="text-base text-left hover:underline"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button
                  className="text-base text-left hover:underline"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </button>
              </SignUpButton>
            </SignedOut>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
