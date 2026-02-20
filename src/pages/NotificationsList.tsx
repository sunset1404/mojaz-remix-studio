import { ChevronRight, Bell, CheckCheck, Calendar, BookOpen, CheckCircle2, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";

type Notification = {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
};

const initialNotifications: Notification[] = [
  {
    id: 1,
    title: "جلسة قادمة",
    message: "لديك جلسة غداً الساعة 8:00 صباحاً مع الشيخ أحمد",
    time: "منذ ساعة",
    read: false,
    icon: Calendar,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    id: 2,
    title: "تذكير بالمراجعة",
    message: "حان وقت مراجعة الحفظ اليومي - سورة البقرة",
    time: "منذ 3 ساعات",
    read: false,
    icon: BookOpen,
    iconBg: "bg-gold/15",
    iconColor: "text-gold",
  },
  {
    id: 3,
    title: "تم قبول طلبك",
    message: "تم قبول طلب التسجيل في برنامج الإجازة",
    time: "أمس",
    read: true,
    icon: CheckCircle2,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    id: 4,
    title: "رسالة جديدة",
    message: "أرسل لك المقرئ ملاحظات حول جلسة الأمس",
    time: "أمس",
    read: true,
    icon: MessageCircle,
    iconBg: "bg-gold/15",
    iconColor: "text-gold",
  },
];

const NotificationsList = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="min-h-screen bg-background pb-28" dir="rtl">
      {/* Header */}
      <div
        className="px-5 pt-14 pb-6"
        style={{
          background:
            "linear-gradient(160deg, hsl(var(--primary)) 0%, hsl(var(--turquoise-dark)) 60%, hsl(var(--primary) / 0.8) 100%)",
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center"
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

      {/* Notifications List */}
      <div className="px-5 -mt-3 space-y-3">
        {notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Bell className="w-10 h-10 text-primary/40" />
            </div>
            <p className="text-foreground font-bold font-cairo mb-1">لا توجد إشعارات</p>
            <p className="text-muted-foreground text-sm">ستظهر إشعاراتك هنا</p>
          </motion.div>
        ) : (
          notifications.map((notif, i) => {
            const Icon = notif.icon;
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => markAsRead(notif.id)}
                className={`glass-card rounded-2xl p-4 flex items-start gap-3 cursor-pointer active:scale-[0.98] transition-transform ${
                  !notif.read ? "border border-primary/20" : "border border-border/50"
                }`}
              >
                {/* Icon */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${notif.iconBg}`}>
                  <Icon className={`w-5 h-5 ${notif.iconColor}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-bold font-cairo leading-snug ${!notif.read ? "text-primary" : "text-foreground"}`}>
                      {notif.title}
                    </p>
                    {!notif.read && (
                      <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{notif.message}</p>
                  <p className="text-[11px] text-muted-foreground/50 mt-1.5">{notif.time}</p>
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
