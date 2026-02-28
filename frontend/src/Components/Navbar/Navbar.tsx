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
  return (
    <div className="flex justify-between items-center w-full h-16 bg-slate-600">
      <div className="flex items-center gap-6 p-6">
        <a
          href={DOCS_URL}
          target={DOCS_URL.startsWith("http") ? "_blank" : undefined}
          rel={DOCS_URL.startsWith("http") ? "noopener noreferrer" : undefined}
          className="text-white/90 text-base hover:text-white hover:underline"
        >
          Docs
        </a>
      </div>
      <p className="text-white text-lg font-semibold order-2 md:order-1">
        LoRa Dashboard
      </p>
      <div className="flex items-center gap-4 p-6 order-3">
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
          <UserButton afterSignOutUrl={withGoto("/")} />
        </SignedIn>
      </div>
    </div>
  );
};

export default Navbar;
