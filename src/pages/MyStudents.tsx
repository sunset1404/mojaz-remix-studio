import { motion } from "framer-motion";
import { Star, Phone, Video, Search, Heart, Users, BookOpen } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import reciter1 from "@/assets/reciters/reciter1.jpg";
import reciter2 from "@/assets/reciters/reciter2.jpg";
import reciter3 from "@/assets/reciters/reciter3.jpg";
import reciter4 from "@/assets/reciters/reciter4.jpg";
import reciter5 from "@/assets/reciters/reciter5.jpg";

const studentsData = [
  { id: 1, name: "عبدالله محمد", track: "حفص عن عاصم", progress: 12, totalJuz: 30, level: 4, active: true, avatar: reciter1 },
  { id: 2, name: "أحمد خالد", track: "حفص عن عاصم", progress: 8, totalJuz: 30, level: 3, active: true, avatar: reciter2 },
  { id: 3, name: "محمد سعيد", track: "ورش عن نافع", progress: 20, totalJuz: 30, level: 6, active: false, avatar: reciter3 },
  { id: 4, name: "يوسف عمر", track: "قالون عن نافع", progress: 5, totalJuz: 30, level: 2, active: true, avatar: reciter4 },
  { id: 5, name: "سلطان فهد", track: "حفص عن عاصم", progress: 15, totalJuz: 30, level: 5, active: true, avatar: reciter5 },
];

type FilterType = "all" | "active" | "favorites";

const MyStudents = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [favorites, setFavorites] = useState<number[]>([]);

  const toggleFavorite = (id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  const filtered = studentsData.filter((s) => {
    const matchSearch = s.name.includes(search) || s.track.includes(search);
    const matchFilter =
      filter === "all" ||
      (filter === "active" && s.active) ||
      (filter === "favorites" && favorites.includes(s.id));
    return matchSearch && matchFilter;
  });

  const tabs: { key: FilterType; label: string }[] = [
    { key: "all", label: "الجميع" },
    { key: "active", label: "نشط الآن" },
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
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            {filter === "favorites" ? "لم تقم بإضافة أي طالب للمفضلة بعد" : "لا توجد نتائج"}
          </div>
        )}
        {filtered.map((student, i) => (
          <div
            key={student.id}
            className="glass-card rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:shadow-lg active:scale-[0.98] transition-all animate-fade-in"
            style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}
          >
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0">
              <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
              <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card ${student.active ? "bg-green-500" : "bg-destructive"}`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-foreground truncate">{student.name}</h3>
              </div>
              <p className="text-xs text-muted-foreground">{student.track}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-xs text-primary">
                  <BookOpen className="w-3 h-3" /> {student.progress}/{student.totalJuz} جزء
                </span>
                <span className="flex items-center gap-1 text-xs text-gold">
                  <Star className="w-3 h-3 fill-current" /> المستوى {student.level}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => { e.stopPropagation(); toggleFavorite(student.id); }}
                className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-destructive/10 transition-colors"
              >
                <Heart className={`w-4 h-4 ${favorites.includes(student.id) ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
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

export default MyStudents;
