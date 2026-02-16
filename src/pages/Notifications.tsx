import { ChevronRight, Bell, Volume2, MessageSquare, BookOpen, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const notificationSettings = [
  {
    id: "session_reminders",
    icon: Clock,
    label: "تذكير الجلسات",
    desc: "تنبيه قبل موعد الجلسة",
  },
  {
    id: "new_messages",
    icon: MessageSquare,
    label: "الرسائل الجديدة",
    desc: "إشعار عند استلام رسالة",
  },
  {
    id: "quran_reminders",
    icon: BookOpen,
    label: "تذكير المراجعة",
    desc: "تذكير يومي بمراجعة الحفظ",
  },
  {
    id: "sound",
    icon: Volume2,
    label: "صوت الإشعارات",
    desc: "تفعيل أو إيقاف الأصوات",
  },
];

const Notifications = () => {
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    session_reminders: true,
    new_messages: true,
    quran_reminders: true,
    sound: false,
  });

  const handleToggle = (id: string) => {
    setToggles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      {/* Header */}
      <div className="gradient-primary px-6 pt-8 pb-5 rounded-b-[2.5rem] text-center relative">
        <Link to="/profile" className="absolute right-4 top-8">
          <ChevronRight className="w-6 h-6 text-primary-foreground" />
        </Link>
        <div className="flex items-center justify-center gap-2">
          <Bell className="w-6 h-6 text-primary-foreground" />
          <h1 className="text-xl font-bold text-primary-foreground">الإشعارات</h1>
        </div>
        <p className="text-primary-foreground/70 text-sm mt-1">تخصيص التنبيهات</p>
      </div>

      {/* Settings */}
      <div className="px-5 mt-6 space-y-3">
        <div className="glass-card rounded-2xl overflow-hidden divide-y divide-border/50">
          {notificationSettings.map((item, i) => (
            <div
              key={item.id}
              className="p-4 flex items-center gap-3 animate-fade-in"
              style={{ animationDelay: `${i * 40}ms`, animationFillMode: "both" }}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground text-sm">{item.label}</p>
                <p className="text-[10px] text-muted-foreground">{item.desc}</p>
              </div>
              <button
                onClick={() => handleToggle(item.id)}
                className={`w-12 h-7 rounded-full transition-all duration-300 relative ${
                  toggles[item.id] ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`absolute top-1 w-5 h-5 rounded-full bg-primary-foreground shadow-sm transition-all duration-300 ${
                    toggles[item.id] ? "right-1" : "right-6"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
