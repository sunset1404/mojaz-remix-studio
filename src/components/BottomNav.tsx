import { Home, Mic, Crown, Trophy, User, Users, Calendar, LayoutDashboard, Settings, BarChart3 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const studentTabs = [
  { path: "/profile", icon: User, label: "حسابي" },
  { path: "/achievements", icon: Trophy, label: "إنجازاتي" },
  { path: "/", icon: Home, label: "الرئيسية", main: true },
  { path: "/reciters", icon: Mic, label: "المقرئون" },
  { path: "/subscription", icon: Crown, label: "الاشتراك" },
];

const reciterTabs = [
  { path: "/sessions", icon: Calendar, label: "الجلسات" },
  { path: "/my-students", icon: Users, label: "طلابي" },
  { path: "/", icon: Home, label: "الرئيسية", main: true },
  { path: "/student-performance", icon: BarChart3, label: "الأداء" },
  { path: "/profile", icon: User, label: "حسابي" },
];

const partnerTabs = [
  { path: "/partner-profile", icon: User, label: "حسابي" },
  { path: "/partner-dashboard", icon: Trophy, label: "المنجزات" },
  { path: "/", icon: Home, label: "الرئيسية", main: true },
  { path: "/partner-students", icon: Users, label: "طلابي" },
];

const adminTabs = [
  { path: "/profile", icon: User, label: "حسابي" },
  { path: "/admin/students", icon: Users, label: "الطلاب" },
  { path: "/", icon: LayoutDashboard, label: "لوحة التحكم", main: true },
  { path: "/admin/reciters", icon: Mic, label: "المقرئون" },
  { path: "/admin/settings", icon: Settings, label: "الإعدادات" },
];

const BottomNav = () => {
  const location = useLocation();
  const { role } = useAuth();
  const tabs = role === "admin" ? adminTabs : role === "partner" ? partnerTabs : role === "reciter" ? reciterTabs : studentTabs;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 max-w-md mx-auto">
      <div className="bg-card/95 backdrop-blur-xl border-t border-border px-2 pt-2 pb-[env(safe-area-inset-bottom,8px)] py-px">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const active = location.pathname === tab.path;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className="flex-1 flex items-center justify-center py-2">

                {tab.main ?
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg gradient-primary ${
                  active ? "animate-pulse-glow" : ""}`
                  }>
                    <tab.icon className="w-6 h-6 text-primary-foreground" />
                  </motion.div> :

                <motion.div
                  className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 transition-colors ${
                  active ? "bg-primary/10" : ""}`
                  }
                  whileTap={{ scale: 0.9 }}>
                    <tab.icon className={`w-6 h-6 shrink-0 transition-colors ${
                  active ? "text-primary" : "text-turquoise-dark"}`
                  } />
                    <span className={`text-[9px] font-medium whitespace-nowrap transition-colors ${
                      active ? "text-primary" : "text-transparent"
                    }`}>
                      {tab.label}
                    </span>
                  </motion.div>
                }
              </Link>);

          })}
        </div>
      </div>
    </div>);

};

export default BottomNav;
