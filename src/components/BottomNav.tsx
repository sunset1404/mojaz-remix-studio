import { Home, Mic, Crown, Trophy, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const tabs = [
  { path: "/profile", icon: User, label: "حسابي" },
  { path: "/achievements", icon: Trophy, label: "إنجازاتي" },
  { path: "/", icon: Home, label: "الرئيسية", main: true },
  { path: "/reciters", icon: Mic, label: "المقرئون" },
  { path: "/subscription", icon: Crown, label: "الاشتراك" },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <div className="fixed bottom-0 inset-x-0 z-50">
      <div className="bg-card/90 backdrop-blur-xl border-t border-border px-2 pb-6 pt-2">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const active = location.pathname === tab.path;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className="flex flex-col items-center gap-0.5 relative"
              >
                {tab.main ? (
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className={`w-14 h-14 -mt-7 rounded-2xl flex items-center justify-center shadow-lg ${
                      active ? "gradient-primary animate-pulse-glow" : "gradient-primary"
                    }`}
                  >
                    <tab.icon className="w-6 h-6 text-primary-foreground" />
                  </motion.div>
                ) : (
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    active ? "bg-primary/10" : ""
                  }`}>
                    <tab.icon className={`w-5 h-5 transition-colors ${
                      active ? "text-primary" : "text-muted-foreground"
                    }`} />
                  </div>
                )}
                <span className={`text-[10px] font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BottomNav;
