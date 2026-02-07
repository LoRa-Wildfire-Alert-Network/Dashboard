import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import "./index.css";
import App from "./App.tsx";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Display setup message if key is missing
if (!PUBLISHABLE_KEY) {
  createRoot(document.getElementById("root")!).render(
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        fontFamily: "system-ui, sans-serif",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <div>
        <h1
          style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#1e293b" }}
        >
          Clerk Setup Required!
        </h1>
        <p style={{ marginBottom: "1rem", color: "#475569" }}>
          Please set up your Clerk key:
        </p>
        <ol
          style={{
            textAlign: "left",
            display: "inline-block",
            color: "#64748b",
          }}
        >
          <li>
            Create a{" "}
            <code
              style={{
                background: "#f1f5f9",
                padding: "0.2rem 0.4rem",
                borderRadius: "0.25rem",
              }}
            >
              .env
            </code>{" "}
            file in the{" "}
            <code
              style={{
                background: "#f1f5f9",
                padding: "0.2rem 0.4rem",
                borderRadius: "0.25rem",
              }}
            >
              frontend
            </code>{" "}
            directory
          </li>
          <li>
            Add:{" "}
            <code
              style={{
                background: "#f1f5f9",
                padding: "0.2rem 0.4rem",
                borderRadius: "0.25rem",
              }}
            >
              VITE_CLERK_PUBLISHABLE_KEY=pk_test_Z3Jvd2luZy1taWRnZS03OS5jbGVyay5hY2NvdW50cy5kZXYk
            </code>
          </li>
          <li>Restart the dev server</li>
          <li>The key above is only for testin in development</li>
        </ol>
      </div>
    </div>,
  );
} else {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ClerkProvider
        publishableKey={PUBLISHABLE_KEY}
        appearance={{
          layout: {
            unsafe_disableDevelopmentModeWarnings: true,
          },
          baseTheme: dark,
          variables: {
            colorPrimary: "#f97316",
            colorBackground: "#0b0f0e",
            colorText: "#e5e7eb",
            colorInputBackground: "#020617",
            borderRadius: "0.75rem",
            fontFamily: "Inter, system-ui, sans-serif",
          },
          elements: {
            card: "shadow-xl border border-neutral-800",
            headerTitle: "text-2xl font-bold tracking-tight",
            headerSubtitle: "text-neutral-400",
            formButtonPrimary:
              "bg-gradient-to-r from-orange-500 to-red-600 hover:opacity-90",
            footerActionLink: "text-orange-400 hover:text-orange-300",
          },
        }}
      >
        <App />
      </ClerkProvider>
    </StrictMode>,
  );
}
