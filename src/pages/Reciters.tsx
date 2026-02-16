import { motion } from "framer-motion";
import { Star, Phone, Video, Search, Heart, Mic } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import sheikh1 from "@/assets/reciters/sheikh1.jpg";
import sheikh2 from "@/assets/reciters/sheikh2.jpg";
import sheikh3 from "@/assets/reciters/sheikh3.jpg";
import sheikh4 from "@/assets/reciters/sheikh4.jpg";
import sheikh5 from "@/assets/reciters/sheikh5.jpg";
import sheikh6 from "@/assets/reciters/sheikh6.jpg";

const recitersData = [
  { id: 1, name: "الشيخ أحمد العجمي", specialty: "حفص عن عاصم", rating: 4.9, students: 1250, available: true, avatar: sheikh1 },
  { id: 2, name: "الشيخ محمد المنشاوي", specialty: "ورش عن نافع", rating: 4.8, students: 980, available: true, avatar: sheikh2 },
  { id: 3, name: "الشيخ عبدالرحمن السديس", specialty: "حفص عن عاصم", rating: 5.0, students: 2100, available: false, avatar: sheikh3 },
  { id: 4, name: "الشيخ ماهر المعيقلي", specialty: "قالون عن نافع", rating: 4.7, students: 850, available: true, avatar: sheikh4 },
  { id: 5, name: "الشيخ سعد الغامدي", specialty: "حفص عن عاصم", rating: 4.9, students: 1600, available: true, avatar: sheikh5 },
  { id: 6, name: "الشيخ فارس عبّاد", specialty: "شعبة عن عاصم", rating: 4.6, students: 720, available: false, avatar: sheikh6 },
];

type FilterType = "all" | "available" | "favorites";

const Reciters = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [favorites, setFavorites] = useState<number[]>([]);

  const toggleFavorite = (id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  const filtered = recitersData.filter((r) => {
    const matchSearch = r.name.includes(search) || r.specialty.includes(search);
    const matchFilter =
      filter === "all" ||
      (filter === "available" && r.available) ||
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

      {/* Reciters List */}
      <div className="px-5 mt-4 space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            {filter === "favorites" ? "لم تقم بإضافة أي مقرئ للمفضلة بعد" : "لا توجد نتائج"}
          </div>
        )}
        {filtered.map((reciter, i) => (
          <div
            key={reciter.id}
            className="glass-card rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:shadow-lg active:scale-[0.98] transition-all animate-fade-in"
            style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}
          >
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0">
              <img src={reciter.avatar} alt={reciter.name} className="w-full h-full object-cover" />
              <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card ${reciter.available ? "bg-green-500" : "bg-destructive"}`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-foreground truncate">{reciter.name}</h3>
              </div>
              <p className="text-xs text-muted-foreground">{reciter.specialty}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-xs text-gold">
                  <Star className="w-3 h-3 fill-current" /> {reciter.rating}
                </span>
                <span className="text-xs text-muted-foreground">{reciter.students} طالب</span>
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
