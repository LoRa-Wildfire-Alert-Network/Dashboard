import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";

const Navbar = () => {
  return (
    <div className="flex justify-between items-center w-full h-16 bg-slate-600">
      <p className="text-white text-lg font-semibold p-6">
        LoRa Wildfire Dashboard
      </p>
      <div className="flex items-center gap-4 p-6">
        <SignedOut>
          <SignInButton mode="modal">
            <button className="text-white text-lg font-semibold hover:underline">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="text-white text-lg font-semibold hover:underline">
              Sign Up
            </button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </div>
  );
};

export default Navbar;
