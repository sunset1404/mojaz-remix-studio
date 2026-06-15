import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initKeyboardInset } from "./lib/keyboardInset";

// Apply saved theme
if (localStorage.getItem("theme") === "dark") {
  document.documentElement.classList.add("dark");
}

// Global on-screen keyboard handling (exposes --keyboard-inset CSS var)
initKeyboardInset();

createRoot(document.getElementById("root")!).render(<App />);
