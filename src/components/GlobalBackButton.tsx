import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

// Routes where the global back button should NOT appear
const HIDE_ON_EXACT = new Set<string>([
  "/",
  "/login",
  "/signup",
  "/reciter-pending",
]);

const HIDE_ON_PREFIX = [
  "/call/", // video call screens
  "/call",
  "/ghuyuf-rahman/survey",
  "/verify/",
];

const GlobalBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  if (HIDE_ON_EXACT.has(path)) return null;
  if (HIDE_ON_PREFIX.some((p) => path.startsWith(p))) return null;

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="رجوع"
      className="fixed top-3 right-3 z-50 sm:absolute sm:top-4 sm:right-4 bg-background/90 backdrop-blur border border-border shadow-md rounded-full p-2 hover:bg-accent transition-colors"
    >
      <ArrowRight className="w-5 h-5 text-foreground" />
    </button>
  );
};

export default GlobalBackButton;
