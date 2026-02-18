import { useAuth } from "@/contexts/AuthContext";
import { Capacitor } from "@capacitor/core";

interface RoleBasedRouteProps {
  student: React.ReactNode;
  reciter: React.ReactNode;
  partner?: React.ReactNode;
  admin?: React.ReactNode;
}

const RoleBasedRoute = ({ student, reciter, partner, admin }: RoleBasedRouteProps) => {
  const { role } = useAuth();
  const isNative = Capacitor.isNativePlatform();
  
  // Hide admin dashboard on native mobile app
  if (role === "admin" && admin && !isNative) return <>{admin}</>;
  if (role === "partner" && partner) return <>{partner}</>;
  return <>{role === "reciter" ? reciter : student}</>;
};

export default RoleBasedRoute;
