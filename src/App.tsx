import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import NotFound from "./pages/NotFound";
import BottomNav from "./components/BottomNav";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="max-w-md mx-auto relative min-h-screen bg-background shadow-2xl">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/reciters" element={<Reciters />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/weekly-plan" element={<WeeklyPlan />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/edit" element={<EditProfile />} />
            <Route path="/certificates" element={<Certificates />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/call-history" element={<CallHistory />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/privacy-security" element={<PrivacySecurity />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNav />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
