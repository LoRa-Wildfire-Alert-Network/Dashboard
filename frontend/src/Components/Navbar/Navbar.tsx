import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
  OrganizationSwitcher,
} from "@clerk/clerk-react";
import { withGoto } from "../../lib/goto";

const Navbar = () => {
  return (
    <div className="flex justify-between items-center w-full h-16 bg-slate-600">
      <p className="text-white text-lg font-semibold p-6">
        LoRa Wildfire Dashboard
      </p>
      <div className="flex items-center gap-4 p-6">
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
