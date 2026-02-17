import { useAuth } from "@/contexts/AuthContext";

interface RoleBasedRouteProps {
  student: React.ReactNode;
  reciter: React.ReactNode;
}

const RoleBasedRoute = ({ student, reciter }: RoleBasedRouteProps) => {
  const { role } = useAuth();
  return <>{role === "reciter" ? reciter : student}</>;
};

export default RoleBasedRoute;
