import { useState } from "react";
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
  Activity, Search, Loader2, Filter, ChevronDown, ChevronUp, CalendarDays,
  AlertTriangle, CheckCircle2, Info, Wifi, Mic, Server, Smartphone
} from "lucide-react";

import type { Json } from "@/integrations/supabase/types";

type DiagnosticRow = {
  id: string;
  room_id: string;
  user_id: string | null;
  role: string;
  verdict: string;
  severity: string;
  local_candidate_type: string | null;
  remote_candidate_type: string | null;
  candidate_protocol: string | null;
  network_type: string | null;
  inbound_audio_packets: number | null;
  outbound_audio_packets: number | null;
  inbound_audio_bytes: number | null;
  outbound_audio_bytes: number | null;
  audio_level: number | null;
  ice_connection_state: string | null;
  connection_state: string | null;
  gathered_candidate_types: string[] | null;
  user_agent: string | null;
  details: Json | null;
  created_at: string;
};

const SEVERITY_MAP: Record<string, { label: string; color: string; icon: typeof Info }> = {
  info: { label: "عادي", color: "bg-blue-500/10 text-blue-600 border-blue-200", icon: Info },
  warning: { label: "تحذير", color: "bg-amber-500/10 text-amber-600 border-amber-200", icon: AlertTriangle },
  critical: { label: "حرج", color: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertTriangle },
};

const verdictLabel = (verdict: string): string => {
  const map: Record<string, string> = {
    diagnostics_started: "بدأ تسجيل التشخيص",
    diagnostic_sampling_failed: "فشل أخذ عينة التشخيص",
    diagnostics_no_rtc_sample: "لا توجد عينة WebRTC",
    media_capture_succeeded: "تم التقاط الكاميرا والميكروفون",
    media_capture_audio_video_failed: "فشل التقاط الكاميرا والميكروفون معاً",
    media_capture_audio_only: "تم التقاط الصوت فقط",
    media_capture_failed_all: "فشل التقاط جميع الوسائط",
    remote_media_tracks_received: "تم استلام مسارات الطرف الآخر",
    remote_audio_playback_started: "بدأ تشغيل الصوت المستلم",
    remote_audio_playback_blocked: "المتصفح منع تشغيل الصوت المستلم",
    remote_audio_playback_failed: "فشل تشغيل الصوت المستلم",
    local_video_playback_started: "بدأ عرض الفيديو المحلي",
    local_video_playback_failed: "فشل عرض الفيديو المحلي",
    remote_video_playback_started: "بدأ عرض فيديو الطرف الآخر",
    remote_video_playback_failed: "فشل عرض فيديو الطرف الآخر",
    signaling_operation_failed: "فشلت عملية التفاوض",
    call_initialization_failed: "فشل تهيئة المكالمة",
    ice_gathering_complete: "اكتمل جمع مرشحي ICE",
    ice_candidate_error: "خطأ أثناء جمع مرشح ICE",
    healthy: "الاتصال سليم",
    healthy_media_flow: "تدفق الصوت والفيديو سليم",
    connecting: "جارٍ الاتصال",
    waiting_for_remote_description: "في انتظار وصف الطرف الآخر",
    ice_checking_no_pair_yet: "جارٍ فحص مسارات ICE",
    candidate_pair_selected_connection_pending: "تم اختيار المسار والاتصال قيد الاكتمال",
    no_selected_candidate_pair: "لم يتم اختيار زوج مرشحين",
    no_candidate_pair_no_srflx_stun_blocked_or_unreachable: "لم يصل STUN أو تم حظر UDP",
    no_candidate_pair_p2p_blocked_stun_only: "تعذر مسار P2P رغم نجاح STUN",
    ice_failed_stun_unreachable_or_udp_blocked: "فشل ICE: STUN غير متاح أو UDP محظور",
    ice_failed_peer_to_peer_path_blocked_stun_only: "فشل ICE: مسار P2P محظور مع STUN فقط",
    ice_failed_even_with_relay: "فشل ICE رغم وجود Relay",
    ice_failed_no_relay_candidate_stun_only: "فشل ICE بدون TURN (STUN فقط)",
    ice_failed_with_relay: "فشل ICE رغم توفر TURN",
    turn_credentials_fetch_started: "بدأ طلب بيانات TURN",
    turn_credentials_fetch_succeeded: "تم الحصول على بيانات TURN",
    turn_credentials_fetch_failed: "فشل طلب بيانات TURN (STUN فقط)",
    turn_credentials_expired: "بيانات TURN منتهية الصلاحية",
    turn_configured: "تم تكوين TURN في الاتصال",
    turn_credentials_obtained: "تم الحصول على بيانات TURN",
    turn_credentials_unavailable: "بيانات TURN غير متاحة (STUN فقط)",

    turn_configured_but_no_relay_candidate: "TURN مُعرَّف لكن لم يُنتج مرشح Relay (السيرفر غير متاح)",
    relay_candidate_gathered: "تم جمع مرشح Relay من TURN",
    connected_via_turn_udp: "الاتصال عبر TURN (UDP)",
    connected_via_turn_tcp: "الاتصال عبر TURN (TCP)",
    connected_via_turn_tls: "الاتصال عبر TURN (TLS)",
    connected_via_turn_unknown_transport: "الاتصال عبر TURN (نقل غير محدد)",
    turn_route_failed: "مسار TURN متصل لكن لا يمرر الصوت",
    camera_required_but_unavailable: "الكاميرا مطلوبة وغير متاحة",
    local_video_reacquire_started: "بدأت محاولة استعادة الكاميرا",
    local_video_reacquire_succeeded: "تم استعادة الكاميرا",
    local_video_reacquire_failed: "فشل استعادة الكاميرا",
    camera_reacquired: "تم استعادة الكاميرا",
    camera_reacquire_failed: "فشل استعادة الكاميرا",

    media_watchdog_stall_detected: "رصد توقف في تدفق الوسائط",
    media_recovery_started: "بدأت محاولة الاستعادة التلقائية",
    media_recovery_succeeded: "نجحت الاستعادة التلقائية",
    media_recovery_failed: "فشلت الاستعادة التلقائية",
    network_change_health_check: "فحص صحة بعد تغيّر الشبكة",
    foreground_health_check: "فحص صحة بعد العودة للتطبيق",
    local_microphone_track_missing_or_ended: "مسار الميكروفون مفقود أو متوقف",
    local_microphone_disabled_by_user: "المستخدم كتم الميكروفون",
    local_microphone_track_muted_by_device: "الجهاز كتم مسار الميكروفون",
    local_video_enabled_but_not_encoding: "الكاميرا مفعلة لكن لا يتم ترميز الفيديو",
    selected_pair_but_no_audio_rtp: "المسار متصل لكن لا توجد حزم صوت",
    no_inbound_audio_rtp: "لا تصل حزم صوت",
    no_outbound_audio_rtp_mic_silent: "لا تخرج حزم صوت والميكروفون صامت",
    audio_capture_present_sender_not_emitting_rtp: "الصوت ملتقط لكن المرسل لا يخرج RTP",
    peer_reports_no_inbound_audio: "الطرف الآخر يؤكد عدم استلام الصوت",
    remote_audio_received_playback_blocked: "وصل الصوت لكن تشغيله محظور",
    remote_audio_received_playback_failed: "وصل الصوت لكن فشل تشغيله",
    one_way_audio_not_receiving_remote_rtp: "صوت اتجاه واحد: لا نستلم RTP",
    one_way_audio_peer_not_receiving_our_rtp: "صوت اتجاه واحد: الطرف الآخر لا يستلم RTP",
    outbound_audio_stalled_mic_silent: "الصوت الصادر متوقف + الميكروفون صامت",
    outbound_audio_stalled_sender_blocked: "الصوت الصادر متوقف (مسار محظور)",
    no_audio_both_directions_media_blocked: "لا يوجد صوت في الاتجاهين",
    degraded_audio_srflx_path: "جودة صوت منخفضة (مسار srflx)",
    degraded_audio_low_packet_rate: "جودة صوت منخفضة (معدل حزم قليل)",
  };
  return map[verdict] || verdict;
};

const SEVERITY_RANK: Record<string, number> = { info: 0, warning: 1, critical: 2 };

const AdminCallDiagnostics = () => {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [verdictFilter, setVerdictFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);

  const { data: rows = [], isLoading, refetch } = useQuery({
    queryKey: ["admin_call_diagnostics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("call_diagnostics")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as DiagnosticRow[];
    },
  });

  const verdicts = Array.from(new Set(rows.map((r) => r.verdict)));

  const filtered = rows.filter((r) => {
    const matchSearch = !search || r.room_id.includes(search) || (r.user_id ?? "").includes(search);
    const matchSeverity = severityFilter === "all" || r.severity === severityFilter;
    const matchVerdict = verdictFilter === "all" || r.verdict === verdictFilter;
    return matchSearch && matchSeverity && matchVerdict;
  });

  const totalRows = rows.length;
  const criticalCount = rows.filter((r) => r.severity === "critical").length;
  const warningCount = rows.filter((r) => r.severity === "warning").length;
  const healthyCount = rows.filter((r) => r.severity === "info").length;
  const oneWayCount = rows.filter((r) => r.verdict.includes("one_way_audio")).length;
  const iceFailedCount = rows.filter((r) => r.verdict.includes("ice_failed")).length;

  const stats = [
    { label: "إجمالي التسجيلات", value: totalRows, icon: Activity, color: "bg-primary/10 text-primary" },
    { label: "حرج", value: criticalCount, icon: AlertTriangle, color: "bg-destructive/10 text-destructive" },
    { label: "تحذير", value: warningCount, icon: AlertTriangle, color: "bg-amber-500/10 text-amber-600" },
    { label: "سليم", value: healthyCount, icon: CheckCircle2, color: "bg-emerald-500/10 text-emerald-600" },
    { label: "صوت اتجاه واحد", value: oneWayCount, icon: Mic, color: "bg-purple-500/10 text-purple-600" },
    { label: "فشل ICE", value: iceFailedCount, icon: Server, color: "bg-blue-500/10 text-blue-600" },
  ];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-4 px-6 py-4">
          <SidebarTrigger />
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground font-cairo">تشخيصات المكالمات</h1>
              <p className="text-xs text-muted-foreground">مراجعة أسباب فشل أو ضعف اتصال الفيديو/الصوت</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-xl">
            تحديث
          </Button>
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
              placeholder="بحث برقم الغرفة أو معرف المستخدم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10 rounded-xl"
            />
          </div>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-40 rounded-xl">
              <Filter className="w-4 h-4 ml-2" />
              <SelectValue placeholder="الخطورة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الخطورات</SelectItem>
              <SelectItem value="critical">حرج</SelectItem>
              <SelectItem value="warning">تحذير</SelectItem>
              <SelectItem value="info">عادي</SelectItem>
            </SelectContent>
          </Select>
          <Select value={verdictFilter} onValueChange={setVerdictFilter}>
            <SelectTrigger className="w-48 rounded-xl">
              <Activity className="w-4 h-4 ml-2" />
              <SelectValue placeholder="التشخيص" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل التشخيصات</SelectItem>
              {verdicts.map((v) => (
                <SelectItem key={v} value={v}>{verdictLabel(v)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline" className="rounded-full px-3 py-1.5">
            {filtered.length} تسجيل
          </Badge>
        </div>

        {/* Diagnostics List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد تشخيصات مطابقة</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((row) => {
              const severityInfo = SEVERITY_MAP[row.severity] || SEVERITY_MAP.info;
              const SeverityIcon = severityInfo.icon;
              const isExpanded = expandedId === row.id;
              const createdAt = new Date(row.created_at).toLocaleString("ar-SA");
              const details = row.details ? (row.details as Record<string, unknown>) : null;

              return (
                <div
                  key={row.id}
                  className="bg-card rounded-2xl border border-border/50 overflow-hidden transition-all hover:border-primary/20"
                >
                  <div
                    className="p-4 flex items-center gap-4 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : row.id)}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${severityInfo.color}`}>
                      <SeverityIcon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-bold text-foreground truncate max-w-[200px]" title={row.room_id}>
                          {row.room_id}
                        </p>
                        <Badge variant="outline" className={`text-[10px] rounded-full ${severityInfo.color}`}>
                          {severityInfo.label}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] rounded-full">
                          {row.role === "caller" ? "متصل" : "متلقي"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {createdAt}
                        </span>
                        <span className="flex items-center gap-1">
                          <Wifi className="w-3 h-3" />
                          {verdictLabel(row.verdict)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Server className="w-3 h-3" />
                          {row.ice_connection_state || "—"} / {row.connection_state || "—"}
                        </span>
                      </div>
                    </div>

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
                        <div className="bg-muted/30 rounded-xl p-3 text-center">
                          <p className="text-lg font-bold text-primary">{row.local_candidate_type || "—"}</p>
                          <p className="text-[11px] text-muted-foreground">مرشح محلي</p>
                        </div>
                        <div className="bg-muted/30 rounded-xl p-3 text-center">
                          <p className="text-lg font-bold text-gold">{row.remote_candidate_type || "—"}</p>
                          <p className="text-[11px] text-muted-foreground">مرشح بعيد</p>
                        </div>
                        <div className="bg-muted/30 rounded-xl p-3 text-center">
                          <p className="text-lg font-bold text-foreground">{row.candidate_protocol || "—"}</p>
                          <p className="text-[11px] text-muted-foreground">البروتوكول</p>
                        </div>
                        <div className="bg-muted/30 rounded-xl p-3 text-center">
                          <p className="text-lg font-bold text-foreground">{row.network_type || "—"}</p>
                          <p className="text-[11px] text-muted-foreground">نوع الشبكة</p>
                        </div>
                        <div className="bg-muted/30 rounded-xl p-3 text-center">
                          <p className="text-lg font-bold text-foreground">{row.inbound_audio_packets ?? "—"}</p>
                          <p className="text-[11px] text-muted-foreground">حزم واردة</p>
                        </div>
                        <div className="bg-muted/30 rounded-xl p-3 text-center">
                          <p className="text-lg font-bold text-foreground">{row.outbound_audio_packets ?? "—"}</p>
                          <p className="text-[11px] text-muted-foreground">حزم صادرة</p>
                        </div>
                        <div className="bg-muted/30 rounded-xl p-3 text-center">
                          <p className="text-lg font-bold text-foreground">{row.audio_level != null ? row.audio_level.toFixed(6) : "—"}</p>
                          <p className="text-[11px] text-muted-foreground">مستوى الصوت</p>
                        </div>
                        <div className="bg-muted/30 rounded-xl p-3 text-center">
                          <p className="text-lg font-bold text-foreground">{(row.gathered_candidate_types ?? []).join(", ") || "—"}</p>
                          <p className="text-[11px] text-muted-foreground">المرشحات المجتمعة</p>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-muted/20 rounded-xl p-3">
                          <p className="text-xs font-semibold text-foreground mb-1">user_id:</p>
                          <p className="text-sm text-muted-foreground font-mono break-all">{row.user_id || "—"}</p>
                        </div>
                        <div className="bg-muted/20 rounded-xl p-3 flex items-start gap-2">
                          <Smartphone className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                          <p className="text-sm text-muted-foreground break-all">{row.user_agent || "—"}</p>
                        </div>
                      </div>

                      {details && (
                        <div className="mt-3 bg-muted/20 rounded-xl p-3">
                          <p className="text-xs font-semibold text-foreground mb-1">تفاصيل إضافية:</p>
                          <pre className="text-xs text-muted-foreground overflow-auto max-h-40 whitespace-pre-wrap break-all">
                            {JSON.stringify(details, null, 2)}
                          </pre>
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

export default AdminCallDiagnostics;
