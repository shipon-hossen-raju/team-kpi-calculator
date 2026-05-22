import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import BudgetCalculator from "./pages/BudgetCalculator.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BudgetCalculator />
  </StrictMode>,
);
