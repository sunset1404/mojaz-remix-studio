import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Reciters from "./pages/Reciters";
import Subscription from "./pages/Subscription";
import Achievements from "./pages/Achievements";
import WeeklyPlan from "./pages/WeeklyPlan";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Certificates from "./pages/Certificates";
import Payments from "./pages/Payments";
import CallHistory from "./pages/CallHistory";
import Notifications from "./pages/Notifications";
import PrivacySecurity from "./pages/PrivacySecurity";
import ContactUs from "./pages/ContactUs";
import AboutApp from "./pages/AboutApp";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ShareApp from "./pages/ShareApp";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ReciterSignup from "./pages/ReciterSignup";
import BottomNav from "./components/BottomNav";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><span className="animate-spin w-8 h-8 border-3 border-primary border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
    <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />
    <Route path="/signup/reciter" element={<AuthRoute><ReciterSignup /></AuthRoute>} />
    <Route path="/" element={<ProtectedRoute><><Index /><BottomNav /></></ProtectedRoute>} />
    <Route path="/reciters" element={<ProtectedRoute><><Reciters /><BottomNav /></></ProtectedRoute>} />
    <Route path="/subscription" element={<ProtectedRoute><><Subscription /><BottomNav /></></ProtectedRoute>} />
    <Route path="/achievements" element={<ProtectedRoute><><Achievements /><BottomNav /></></ProtectedRoute>} />
    <Route path="/weekly-plan" element={<ProtectedRoute><><WeeklyPlan /><BottomNav /></></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><><Profile /><BottomNav /></></ProtectedRoute>} />
    <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
    <Route path="/certificates" element={<ProtectedRoute><Certificates /></ProtectedRoute>} />
    <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
    <Route path="/call-history" element={<ProtectedRoute><CallHistory /></ProtectedRoute>} />
    <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
    <Route path="/privacy-security" element={<ProtectedRoute><PrivacySecurity /></ProtectedRoute>} />
    <Route path="/contact-us" element={<ProtectedRoute><ContactUs /></ProtectedRoute>} />
    <Route path="/about" element={<ProtectedRoute><AboutApp /></ProtectedRoute>} />
    <Route path="/privacy-policy" element={<ProtectedRoute><PrivacyPolicy /></ProtectedRoute>} />
    <Route path="/share-app" element={<ProtectedRoute><ShareApp /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <div className="max-w-md mx-auto relative min-h-screen bg-background shadow-2xl">
            <AppRoutes />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
