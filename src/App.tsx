import { Capacitor } from "@capacitor/core";
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import RoleBasedRoute from "@/components/RoleBasedRoute";
import Index from "./pages/Index";
import ReciterHome from "./pages/ReciterHome";
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
import StudentSignup from "./pages/StudentSignup";
import SignupSuccess from "./pages/SignupSuccess";
import ReciterPending from "./pages/ReciterPending";
import MyStudents from "./pages/MyStudents";
import Sessions from "./pages/Sessions";
import BottomNav from "./components/BottomNav";
import PartnerHome from "./pages/PartnerHome";
import PartnerDashboard from "./pages/PartnerDashboard";
import PartnerStudents from "./pages/PartnerStudents";
import PartnerProfile from "./pages/PartnerProfile";
import GiftSubscription from "./pages/GiftSubscription";
import RedeemGift from "./pages/RedeemGift";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSidebar from "./components/AdminSidebar";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminStudents from "./pages/AdminStudents";
import AdminReciters from "./pages/AdminReciters";
import AdminPartners from "./pages/AdminPartners";
import AdminIjazahStudents from "./pages/AdminIjazahStudents";
import AdminCertificates from "./pages/AdminCertificates";
import AdminCertificateTemplates from "./pages/AdminCertificateTemplates";
import AdminExams from "./pages/AdminExams";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode; allowedRole?: "student" | "reciter" | "partner" }) => {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><span className="animate-spin w-8 h-8 border-3 border-primary border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRole && role && role !== allowedRole) return <Navigate to="/" replace />;
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
    <Route path="/signup/student" element={<AuthRoute><StudentSignup /></AuthRoute>} />
    <Route path="/signup/success" element={<SignupSuccess />} />
    <Route path="/forgot-password" element={<AuthRoute><ForgotPassword /></AuthRoute>} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/reciter-pending" element={<ProtectedRoute><ReciterPending /></ProtectedRoute>} />

    {/* Role-based home */}
    <Route path="/" element={
      <ProtectedRoute>
        <RoleBasedRoute
          student={<><Index /><BottomNav /></>}
          reciter={<><ReciterHome /><BottomNav /></>}
          partner={<><PartnerHome /><BottomNav /></>}
          admin={<AdminDashboard />}
        />
      </ProtectedRoute>
    } />

    {/* Admin routes */}
    <Route path="/admin/students" element={<ProtectedRoute><AdminStudents /></ProtectedRoute>} />
    <Route path="/admin/ijazah-students" element={<ProtectedRoute><AdminIjazahStudents /></ProtectedRoute>} />
    <Route path="/admin/reciters" element={<ProtectedRoute><AdminReciters /></ProtectedRoute>} />
    <Route path="/admin/partners" element={<ProtectedRoute><AdminPartners /></ProtectedRoute>} />
    <Route path="/admin/certificates" element={<ProtectedRoute><AdminCertificates /></ProtectedRoute>} />
    <Route path="/admin/certificate-templates" element={<ProtectedRoute><AdminCertificateTemplates /></ProtectedRoute>} />
    <Route path="/admin/exams" element={<ProtectedRoute><AdminExams /></ProtectedRoute>} />

    {/* Student-only routes */}
    <Route path="/reciters" element={<ProtectedRoute allowedRole="student"><><Reciters /><BottomNav /></></ProtectedRoute>} />
    <Route path="/subscription" element={<ProtectedRoute allowedRole="student"><><Subscription /><BottomNav /></></ProtectedRoute>} />
    <Route path="/gift" element={<ProtectedRoute allowedRole="student"><><GiftSubscription /><BottomNav /></></ProtectedRoute>} />

    {/* Redeem gift - accessible to all authenticated users */}
    <Route path="/redeem-gift" element={<ProtectedRoute><RedeemGift /></ProtectedRoute>} />

    {/* Reciter-only routes */}
    <Route path="/my-students" element={<ProtectedRoute allowedRole="reciter"><><MyStudents /><BottomNav /></></ProtectedRoute>} />
    <Route path="/sessions" element={<ProtectedRoute allowedRole="reciter"><><Sessions /><BottomNav /></></ProtectedRoute>} />

    {/* Partner-only routes */}
    <Route path="/partner-dashboard" element={<ProtectedRoute allowedRole="partner"><><PartnerDashboard /><BottomNav /></></ProtectedRoute>} />
    <Route path="/partner-students" element={<ProtectedRoute allowedRole="partner"><><PartnerStudents /><BottomNav /></></ProtectedRoute>} />
    <Route path="/partner-profile" element={<ProtectedRoute allowedRole="partner"><><PartnerProfile /><BottomNav /></></ProtectedRoute>} />

    {/* Shared routes */}
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

const AppLayout = () => {
  const { role } = useAuth();
  const isNative = Capacitor.isNativePlatform();
  const isAdmin = role === "admin" && !isNative;

  if (isAdmin) {
    return (
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full bg-background" dir="rtl">
          <AdminSidebar />
          <main className="flex-1 overflow-auto">
            <AppRoutes />
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <div className="max-w-md mx-auto relative min-h-screen bg-background shadow-2xl">
      <AppRoutes />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppLayout />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
