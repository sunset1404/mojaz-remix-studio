import { useAuth } from "@/contexts/AuthContext";

interface RoleBasedRouteProps {
  student: React.ReactNode;
  reciter: React.ReactNode;
  partner?: React.ReactNode;
  admin?: React.ReactNode;
}

const RoleBasedRoute = ({ student, reciter, partner, admin }: RoleBasedRouteProps) => {
  const { role } = useAuth();
  if (role === "admin" && admin) return <>{admin}</>;
  if (role === "partner" && partner) return <>{partner}</>;
  return <>{role === "reciter" ? reciter : student}</>;
};

export default RoleBasedRoute;
