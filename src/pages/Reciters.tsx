import { motion } from "framer-motion";
import { Star, Phone, Video, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

const reciters = [
  { id: 1, name: "الشيخ أحمد العجمي", specialty: "حفص عن عاصم", rating: 4.9, students: 1250, available: true, avatar: "🧔" },
  { id: 2, name: "الشيخ محمد المنشاوي", specialty: "ورش عن نافع", rating: 4.8, students: 980, available: true, avatar: "👳" },
  { id: 3, name: "الشيخ عبدالرحمن السديس", specialty: "حفص عن عاصم", rating: 5.0, students: 2100, available: false, avatar: "🧕" },
  { id: 4, name: "الشيخ ماهر المعيقلي", specialty: "قالون عن نافع", rating: 4.7, students: 850, available: true, avatar: "🎓" },
  { id: 5, name: "الشيخ سعد الغامدي", specialty: "حفص عن عاصم", rating: 4.9, students: 1600, available: true, avatar: "📖" },
  { id: 6, name: "الشيخ فارس عبّاد", specialty: "شعبة عن عاصم", rating: 4.6, students: 720, available: false, avatar: "🌙" },
];

const Reciters = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "available">("all");

  const filtered = reciters.filter((r) => {
    const matchSearch = r.name.includes(search) || r.specialty.includes(search);
    const matchFilter = filter === "all" || r.available;
    return matchSearch && matchFilter;
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-primary px-6 pt-12 pb-8 rounded-b-[2.5rem]">
        <motion.h1
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-2xl font-bold text-primary-foreground mb-4"
        >
          🎙️ المقرئون
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
        {[
          { key: "all" as const, label: "الجميع" },
          { key: "available" as const, label: "متاح الآن" },
        ].map((tab) => (
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
        {filtered.map((reciter, i) => (
          <motion.div
            key={reciter.id}
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            whileTap={{ scale: 0.98 }}
            className="glass-card rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:shadow-lg transition-all"
          >
            <div className="relative w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center text-2xl shrink-0">
              {reciter.avatar}
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

            <div className="flex items-center gap-2">
              <button className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                <Phone className="w-4 h-4 text-primary" />
              </button>
              <button className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                <Video className="w-4 h-4 text-primary" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Reciters;
