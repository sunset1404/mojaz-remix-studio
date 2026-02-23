import { motion } from "framer-motion";
import { Star, Phone, Video, Search, Heart, Mic, User } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOnlineReciters } from "@/hooks/useOnlineReciters";

type Reciter = {
  id: string;
  user_id: string;
  full_name: string;
  preferred_track: string;
  stamp_url: string | null;
};

type FilterType = "all" | "available" | "favorites";

const Reciters = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [loading, setLoading] = useState(true);
  const onlineReciters = useOnlineReciters();

  useEffect(() => {
    const fetchReciters = async () => {
      // Get student gender first
      let studentGender: string | null = null;
      if (user) {
        const { data: profile } = await supabase
          .from("student_profiles")
          .select("gender")
          .eq("user_id", user.id)
          .maybeSingle();
        studentGender = profile?.gender ?? null;
      }

      let query = supabase
        .from("reciter_profiles")
        .select("id, user_id, full_name, preferred_track, stamp_url")
        .eq("status", "approved");

      if (studentGender) {
        query = query.eq("gender", studentGender);
      }

      const { data } = await query;
      setReciters(data ?? []);
      setLoading(false);
    };
    fetchReciters();
  }, [user]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  const filtered = reciters.filter((r) => {
    const matchSearch = r.full_name.includes(search) || r.preferred_track.includes(search);
    const isOnline = onlineReciters.has(r.user_id);
    const matchFilter =
      filter === "all" ||
      (filter === "available" && isOnline) ||
      (filter === "favorites" && favorites.includes(r.id));
    return matchSearch && matchFilter;
  });

  const tabs: { key: FilterType; label: string }[] = [
    { key: "all", label: "الجميع" },
    { key: "available", label: "متاح الآن" },
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
          <Mic className="w-6 h-6" />
          المقرئون
        </motion.h1>

        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن مقرئ..."
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
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === tab.key
                ? "gradient-primary text-primary-foreground shadow-md"
                : "bg-muted text-muted-foreground"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reciters List */}
      <div className="px-5 mt-4 space-y-3">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="glass-card rounded-2xl p-4 flex items-center gap-4 animate-pulse">
                <div className="w-14 h-14 rounded-2xl bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            {filter === "favorites" ? "لم تقم بإضافة أي مقرئ للمفضلة بعد" : "لا يوجد مقرئون معتمدون حالياً"}
          </div>
        )}

        {!loading && filtered.map((reciter, i) => (
          <div
            key={reciter.id}
            className="glass-card rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:shadow-lg active:scale-[0.98] transition-all animate-fade-in"
            style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}
          >
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 bg-muted flex items-center justify-center">
              {reciter.stamp_url ? (
                <img src={reciter.stamp_url} alt={reciter.full_name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-7 h-7 text-muted-foreground" />
              )}
              {(() => {
                const isOnline = onlineReciters.has(reciter.user_id);
                return (
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                );
              })()}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground truncate">{reciter.full_name}</h3>
              <p className="text-xs text-muted-foreground">{reciter.preferred_track || "—"}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3 h-3 text-gold fill-current" />
                <span className="text-xs text-gold font-semibold">معتمد</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => { e.stopPropagation(); toggleFavorite(reciter.id); }}
                className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-destructive/10 transition-colors"
              >
                <Heart className={`w-4 h-4 ${favorites.includes(reciter.id) ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
              </button>
              <button className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                <Phone className="w-4 h-4 text-primary" />
              </button>
              <button className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                <Video className="w-4 h-4 text-primary" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reciters;
