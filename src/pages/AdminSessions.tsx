import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Clock, Search, Users, CheckCircle2, XCircle, CalendarDays,
  Timer, TrendingUp, Loader2, Filter, ChevronDown, ChevronUp
} from "lucide-react";

type SessionRecord = {
  id: string;
  user_id: string;
  other_user_name: string;
  date: string;
  time: string;
  duration: string;
  status: string;
  rating: number | null;
  notes: string | null;
  pages_reached: number | null;
  parts_reached: number | null;
  created_at: string;
};

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  "مكتملة": { label: "مكتملة", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200", icon: CheckCircle2 },
  "ملغاة": { label: "ملغاة", color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
  "قادمة": { label: "قادمة", color: "bg-blue-500/10 text-blue-600 border-blue-200", icon: CalendarDays },
};

const parseDurationMinutes = (d: string): number => {
  const nums = d.replace(/[^0-9]/g, "");
  return nums ? parseInt(nums, 10) : 0;
};

const AdminSessions = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["admin_sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("session_records")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SessionRecord[];
    },
  });

  const filtered = sessions.filter((s) => {
    const matchSearch = !search || s.other_user_name.includes(search) || s.date.includes(search);
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalSessions = sessions.length;
  const completedSessions = sessions.filter((s) => s.status === "مكتملة").length;
  const cancelledSessions = sessions.filter((s) => s.status === "ملغاة").length;
  const upcomingSessions = sessions.filter((s) => s.status === "قادمة").length;
  const totalMinutes = sessions
    .filter((s) => s.status === "مكتملة")
    .reduce((sum, s) => sum + parseDurationMinutes(s.duration), 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const avgRating = (() => {
    const rated = sessions.filter((s) => s.rating != null);
    if (rated.length === 0) return 0;
    return (rated.reduce((sum, s) => sum + (s.rating || 0), 0) / rated.length).toFixed(1);
  })();

  const stats = [
    { label: "إجمالي الجلسات", value: totalSessions, icon: Clock, color: "bg-primary/10 text-primary" },
    { label: "مكتملة", value: completedSessions, icon: CheckCircle2, color: "bg-emerald-500/10 text-emerald-600" },
    { label: "ملغاة", value: cancelledSessions, icon: XCircle, color: "bg-destructive/10 text-destructive" },
    { label: "قادمة", value: upcomingSessions, icon: CalendarDays, color: "bg-blue-500/10 text-blue-600" },
    { label: "إجمالي الساعات", value: totalHours, icon: Timer, color: "bg-gold/15 text-gold" },
    { label: "متوسط التقييم", value: avgRating, icon: TrendingUp, color: "bg-purple-500/10 text-purple-600" },
  ];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-4 px-6 py-4">
          <SidebarTrigger />
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground font-cairo">إدارة الجلسات</h1>
              <p className="text-xs text-muted-foreground">متابعة وإدارة جميع جلسات الإقراء</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-card rounded-2xl border border-border/50 p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{isLoading ? "..." : s.value}</p>
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو التاريخ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10 rounded-xl"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 rounded-xl">
              <Filter className="w-4 h-4 ml-2" />
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="مكتملة">مكتملة</SelectItem>
              <SelectItem value="ملغاة">ملغاة</SelectItem>
              <SelectItem value="قادمة">قادمة</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="rounded-full px-3 py-1.5">
            {filtered.length} جلسة
          </Badge>
        </div>

        {/* Sessions List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد جلسات مطابقة</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((session) => {
              const statusInfo = STATUS_MAP[session.status] || STATUS_MAP["قادمة"];
              const StatusIcon = statusInfo.icon;
              const isExpanded = expandedId === session.id;

              return (
                <div
                  key={session.id}
                  className="bg-card rounded-2xl border border-border/50 overflow-hidden transition-all hover:border-primary/20"
                >
                  <div
                    className="p-4 flex items-center gap-4 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : session.id)}
                  >
                    {/* Status icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${statusInfo.color}`}>
                      <StatusIcon className="w-5 h-5" />
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-foreground truncate">{session.other_user_name}</p>
                        <Badge variant="outline" className={`text-[10px] rounded-full ${statusInfo.color}`}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {session.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {session.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Timer className="w-3 h-3" />
                          {session.duration}
                        </span>
                        {session.rating != null && (
                          <span className="flex items-center gap-1 text-gold">
                            ⭐ {session.rating}/5
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expand arrow */}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-border/30">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                        {session.parts_reached != null && (
                          <div className="bg-muted/30 rounded-xl p-3 text-center">
                            <p className="text-lg font-bold text-primary">{session.parts_reached}</p>
                            <p className="text-[11px] text-muted-foreground">الجزء الحالي</p>
                          </div>
                        )}
                        {session.pages_reached != null && (
                          <div className="bg-muted/30 rounded-xl p-3 text-center">
                            <p className="text-lg font-bold text-gold">{session.pages_reached}</p>
                            <p className="text-[11px] text-muted-foreground">الصفحة الحالية</p>
                          </div>
                        )}
                        {session.rating != null && (
                          <div className="bg-muted/30 rounded-xl p-3 text-center">
                            <p className="text-lg font-bold text-foreground">⭐ {session.rating}/5</p>
                            <p className="text-[11px] text-muted-foreground">التقييم</p>
                          </div>
                        )}
                        <div className="bg-muted/30 rounded-xl p-3 text-center">
                          <p className="text-lg font-bold text-foreground">{session.duration}</p>
                          <p className="text-[11px] text-muted-foreground">المدة</p>
                        </div>
                      </div>
                      {session.notes && (
                        <div className="mt-3 bg-muted/20 rounded-xl p-3">
                          <p className="text-xs font-semibold text-foreground mb-1">ملاحظات المقرئ:</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">{session.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSessions;
