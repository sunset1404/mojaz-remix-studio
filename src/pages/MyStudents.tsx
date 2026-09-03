import { motion } from "framer-motion";
import { Star, Phone, Search, Heart, Users, BookOpen, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type FilterType = "all" | "favorites";

const MyStudents = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from("student_profiles")
      .select("user_id, full_name, preferred_riwaya, preferred_track")
      .eq("assigned_reciter_id", user.id)
      .then(async ({ data }) => {
        if (data) {
          const studentIds = data.map(s => s.user_id);
          const safeIds = studentIds.length > 0 ? studentIds : ["none"];
          
          const [{ data: achievements }, { data: profiles }] = await Promise.all([
            supabase.from("student_achievements").select("student_id, parts_memorized").in("student_id", safeIds),
            supabase.from("profiles").select("user_id, avatar_url").in("user_id", safeIds),
          ]);
          
          const achMap: Record<string, number> = {};
          achievements?.forEach(a => { achMap[a.student_id] = a.parts_memorized; });
          
          const avatarMap: Record<string, string | null> = {};
          profiles?.forEach(p => {
            if (p.avatar_url) {
              const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(p.avatar_url);
              avatarMap[p.user_id] = urlData?.publicUrl || null;
            }
          });
          
          setStudents(data.map(s => ({
            ...s,
            parts_memorized: achMap[s.user_id] || 0,
            avatarUrl: avatarMap[s.user_id] || null,
          })));
          setLoading(false);
        } else {
          setLoading(false);
        }
      });
  }, [user]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  const filtered = students.filter((s) => {
    const matchSearch = s.full_name.includes(search) || (s.preferred_riwaya || "").includes(search);
    const matchFilter =
      filter === "all" ||
      (filter === "favorites" && favorites.includes(s.user_id));
    return matchSearch && matchFilter;
  });

  const tabs: { key: FilterType; label: string }[] = [
    { key: "all", label: "الجميع" },
    { key: "favorites", label: "المفضلة" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-primary px-6 pt-12 pb-8 rounded-b-[2.5rem]">
        <motion.h1
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-2xl font-bold text-primary-foreground mb-4 flex items-center justify-center gap-2"
        >
          <Users className="w-6 h-6" />
          طلابي
        </motion.h1>

        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن طالب..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-primary-foreground/95 border-0 pr-10 rounded-xl text-foreground placeholder:text-muted-foreground"
          />
        </motion.div>
      </div>

      {/* Filter Tabs */}
      <div className="px-5 mt-4 flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === tab.key
                ? "gradient-primary text-primary-foreground shadow-md"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Students List */}
      <div className="px-5 mt-4 space-y-3">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            {filter === "favorites" ? "لم تقم بإضافة أي طالب للمفضلة بعد" : "لا يوجد طلاب مسكّنين عليك حالياً"}
          </div>
        ) : (
          filtered.map((student, i) => (
            <div
              key={student.user_id}
              onClick={() => navigate(`/my-students/${student.user_id}`)}
              className="glass-card rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:shadow-lg active:scale-[0.98] transition-all animate-fade-in"
              style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}
            >
              <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 bg-muted flex items-center justify-center">
                {student.avatarUrl ? (
                  <img src={student.avatarUrl} alt={student.full_name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-7 h-7 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground truncate">{student.full_name}</h3>
                <p className="text-xs text-muted-foreground">{student.preferred_riwaya || student.preferred_track}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs text-primary">
                    <BookOpen className="w-3 h-3" /> {student.parts_memorized}/30 جزء
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(student.user_id); }}
                  className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-destructive/10 transition-colors"
                >
                  <Heart className={`w-4 h-4 ${favorites.includes(student.user_id) ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/call/new", { state: { studentId: student.user_id, studentName: student.full_name } });
                  }}
                  className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                >
                  <Phone className="w-4 h-4 text-primary" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyStudents;
