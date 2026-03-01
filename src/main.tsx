import { createRoot } from "react-dom/client";
import { clearStaleSession } from "./lib/clearStaleSession";
import App from "./App.tsx";
import "./index.css";

// Clear any stale auth tokens BEFORE React/Supabase initializes
// This prevents the infinite refresh_token retry loop
clearStaleSession();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(<App />);
