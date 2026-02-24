import { ChevronRight, Bell, CheckCheck, Calendar, BookOpen, CheckCircle2, MessageCircle, Award, Users, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type NotifType = "bell" | "book" | "award" | "users";

type Notification = {
  id: string;
  title: string;
  body: string;
  type: NotifType;
  read: boolean;
  created_at: string;
};

const TYPE_CONFIG: Record<NotifType, { icon: React.ElementType; iconBg: string; iconColor: string }> = {
  bell:  { icon: Bell,          iconBg: "bg-primary/10",  iconColor: "text-primary" },
  book:  { icon: BookOpen,      iconBg: "bg-gold/15",     iconColor: "text-gold" },
  award: { icon: Award,         iconBg: "bg-primary/10",  iconColor: "text-primary" },
  users: { icon: Users,         iconBg: "bg-blue-500/10", iconColor: "text-blue-600" },
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `منذ ${hrs} ساعة`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "أمس";
  return `منذ ${days} أيام`;
};

const NotificationsList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    setNotifications((data as Notification[]) || []);
    setLoading(false);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase.from("notifications").update({ read: true }).eq("user_id", user!.id);
  };

  return (
    <div className="min-h-screen bg-background pb-28" dir="rtl">
      {/* Header */}
      <div
        className="px-5 pt-14 pb-6"
        style={{ background: "linear-gradient(160deg, hsl(var(--primary)) 0%, hsl(var(--turquoise-dark)) 60%, hsl(var(--primary) / 0.8) 100%)" }}
      >
        <div className="flex items-center justify-between mb-1">
          <button
            onClick={() => navigate("/")}
            className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-white/90" />
              <h1 className="text-lg font-bold text-white font-cairo">الإشعارات</h1>
            </div>
            {unreadCount > 0 && (
              <span className="text-xs text-white/70 mt-0.5">{unreadCount} غير مقروء</span>
            )}
          </div>

          {unreadCount > 0 ? (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5"
            >
              <CheckCheck className="w-3.5 h-3.5 text-white" />
              <span className="text-xs text-white font-semibold">الكل</span>
            </button>
          ) : (
            <div className="w-16" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 mt-5 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Bell className="w-10 h-10 text-primary/40" />
            </div>
            <p className="text-foreground font-bold font-cairo mb-1">لا توجد إشعارات</p>
            <p className="text-muted-foreground text-sm">ستظهر إشعاراتك هنا</p>
          </motion.div>
        ) : (
          notifications.map((notif, i) => {
            const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.bell;
            const Icon = cfg.icon;
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => markAsRead(notif.id)}
                className={`glass-card rounded-2xl p-4 flex items-start gap-3 cursor-pointer active:scale-[0.98] transition-transform ${
                  !notif.read ? "border border-primary/20" : "border border-border/50"
                }`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${cfg.iconBg}`}>
                  <Icon className={`w-5 h-5 ${cfg.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-bold font-cairo leading-snug ${!notif.read ? "text-primary" : "text-foreground"}`}>
                      {notif.title}
                    </p>
                    {!notif.read && <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-1" />}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{notif.body}</p>
                  <p className="text-[11px] text-muted-foreground/50 mt-1.5">{timeAgo(notif.created_at)}</p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotificationsList;
