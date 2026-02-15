import { Home, Mic, Crown, Trophy, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const tabs = [
{ path: "/profile", icon: User, label: "حسابي" },
{ path: "/achievements", icon: Trophy, label: "إنجازاتي" },
{ path: "/", icon: Home, label: "الرئيسية", main: true },
{ path: "/reciters", icon: Mic, label: "المقرئون" },
{ path: "/subscription", icon: Crown, label: "الاشتراك" }];


const BottomNav = () => {
  const location = useLocation();

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
                className="flex items-center justify-center relative py-2">

                {tab.main ?
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg gradient-primary ${
                  active ? "animate-pulse-glow" : ""}`
                  }>

                    <tab.icon className="w-6 h-6 text-primary-foreground" />
                  </motion.div> :

                <motion.div
                  layout
                  className={`flex items-center gap-1.5 rounded-xl px-2 py-2 transition-colors ${
                  active ? "bg-primary/10" : ""}`
                  }
                  whileTap={{ scale: 0.9 }}>

                    <tab.icon className={`w-6 h-6 shrink-0 transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"}`
                  } />
                    <AnimatePresence>
                      {active &&
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 28 }}
                      className="text-[11px] font-medium text-primary whitespace-nowrap overflow-hidden">

                          {tab.label}
                        </motion.span>
                    }
                    </AnimatePresence>
                  </motion.div>
                }
              </Link>);

          })}
        </div>
      </div>
    </div>);

};

export default BottomNav;