import Navbar from "./Components/Navbar/Navbar";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import Dashboard from "./Components/Dashboard/Dashboard";
import AuthProvider from "./providers/AuthProvider";

import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Navbar />
      <SignedIn>
        <Dashboard />
      </SignedIn>
      <SignedOut>
        <div className="bg-slate-300 h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-semibold mb-4">
              Welcome to LoRa Wildfire Dashboard
            </h1>
            <p className="text-lg mb-4">
              Please sign in to access the dashboard
            </p>
          </div>
        </div>
      </SignedOut>
    </AuthProvider>
  );
}

export default App;
