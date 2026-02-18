import { useAuth } from "@/contexts/AuthContext";

interface RoleBasedRouteProps {
  student: React.ReactNode;
  reciter: React.ReactNode;
  partner?: React.ReactNode;
}

const RoleBasedRoute = ({ student, reciter, partner }: RoleBasedRouteProps) => {
  const { role } = useAuth();
  if (role === "partner" && partner) return <>{partner}</>;
  return <>{role === "reciter" ? reciter : student}</>;
};

export default RoleBasedRoute;
