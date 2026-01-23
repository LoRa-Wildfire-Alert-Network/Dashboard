import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import "./index.css";
import App from "./App.tsx";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Display setup message if key is missing 
if (!PUBLISHABLE_KEY) {
  createRoot(document.getElementById("root")!).render(
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      fontFamily: 'system-ui, sans-serif',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1e293b' }}>
          Clerk Setup Required!
        </h1>
        <p style={{ marginBottom: '1rem', color: '#475569' }}>
          Please set up your Clerk key:
        </p>
        <ol style={{ textAlign: 'left', display: 'inline-block', color: '#64748b' }}>
          
          <li>Create a <code style={{ background: '#f1f5f9', padding: '0.2rem 0.4rem', borderRadius: '0.25rem' }}>.env</code> file in the <code style={{ background: '#f1f5f9', padding: '0.2rem 0.4rem', borderRadius: '0.25rem' }}>frontend</code> directory</li>
          <li>Add: <code style={{ background: '#f1f5f9', padding: '0.2rem 0.4rem', borderRadius: '0.25rem' }}>VITE_CLERK_PUBLISHABLE_KEY=pk_test_Z3Jvd2luZy1taWRnZS03OS5jbGVyay5hY2NvdW50cy5kZXYk</code></li>
          <li>Restart the dev server</li>
          <li>The key above is only for testin in development</li>
        </ol>
      </div>
    </div>
  );
} else {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <App />
      </ClerkProvider>
    </StrictMode>,
  );
}
