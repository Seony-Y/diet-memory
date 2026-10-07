import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./design.css";
import "./global.css";
import "./diet-app.css";
import "./features/dashboard/dashboard.css";
import "./features/ingredients/ingredients.css";
import { AuthGate } from "./features/auth/AuthGate";
import { PwaInstallPrompt } from "./features/pwa/PwaInstallPrompt";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthGate />
    <PwaInstallPrompt />
  </StrictMode>,
);
