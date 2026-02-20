import { ChevronRight, Bell, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const mockNotifications = [
  {
    id: 1,
    title: "جلسة قادمة",
    message: "لديك جلسة غداً الساعة 8:00 صباحاً مع الشيخ أحمد",
    time: "منذ ساعة",
    read: false,
    icon: "📅",
  },
  {
    id: 2,
    title: "تذكير بالمراجعة",
    message: "حان وقت مراجعة الحفظ اليومي - سورة البقرة",
    time: "منذ 3 ساعات",
    read: false,
    icon: "📖",
  },
  {
    id: 3,
    title: "تم قبول طلبك",
    message: "تم قبول طلب التسجيل في برنامج الإجازة",
    time: "أمس",
    read: true,
    icon: "✅",
  },
  {
    id: 4,
    title: "رسالة جديدة",
    message: "أرسل لك المقرئ ملاحظات حول جلسة الأمس",
    time: "أمس",
    read: true,
    icon: "💬",
  },
];

const NotificationsList = () => {
  const navigate = useNavigate();
  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-card border-b border-border px-5 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground font-cairo">الإشعارات</h1>
          {unreadCount > 0 ? (
            <button className="text-xs text-primary font-semibold flex items-center gap-1">
              <CheckCheck className="w-4 h-4" />
              قراءة الكل
            </button>
          ) : (
            <div className="w-9" />
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="px-5 pt-4 space-y-3">
        {mockNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bell className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-cairo">لا توجد إشعارات</p>
          </div>
        ) : (
          mockNotifications.map((notif, i) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-start gap-3 p-4 rounded-2xl border ${
                notif.read
                  ? "bg-card border-border"
                  : "bg-primary/5 border-primary/20"
              }`}
            >
              <div className="text-2xl mt-0.5">{notif.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className={`text-sm font-bold font-cairo ${notif.read ? "text-foreground" : "text-primary"}`}>
                    {notif.title}
                  </p>
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{notif.message}</p>
                <p className="text-[11px] text-muted-foreground/60 mt-1">{notif.time}</p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsList;
