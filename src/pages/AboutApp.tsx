import { ChevronRight, Info, Star, Code, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const AboutApp = () => {
  return (
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      {/* Header */}
      <div className="gradient-primary px-6 pt-8 pb-5 rounded-b-[2.5rem] text-center relative">
        <Link to="/profile" className="absolute right-4 top-8">
          <ChevronRight className="w-6 h-6 text-primary-foreground" />
        </Link>
        <div className="flex items-center justify-center gap-2">
          <Info className="w-6 h-6 text-primary-foreground" />
          <h1 className="text-xl font-bold text-primary-foreground">عن التطبيق</h1>
        </div>
        <p className="text-primary-foreground/70 text-sm mt-1">الإصدار ١.٠.٠</p>
      </div>

      <div className="px-5 mt-6 space-y-5">
        {/* App Info */}
        <div className="glass-card rounded-2xl p-6 text-center animate-fade-in" style={{ animationFillMode: "both" }}>
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Star className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-foreground">مُقرئ</h2>
          <p className="text-sm text-muted-foreground mt-1">منصة إقراء القرآن الكريم عن بُعد</p>
          <p className="text-[10px] text-muted-foreground mt-2">الإصدار 1.0.0</p>
        </div>

        {/* Description */}
        <div className="glass-card rounded-2xl p-5 animate-fade-in" style={{ animationDelay: "80ms", animationFillMode: "both" }}>
          <h3 className="font-bold text-foreground text-sm mb-2">عن المنصة</h3>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            منصة مُقرئ هي منصة تعليمية متخصصة في إقراء القرآن الكريم عن بُعد، تربط الطلاب بنخبة من المقرئين المجازين. تهدف المنصة إلى تسهيل تعلم القرآن الكريم وإتقان تلاوته من أي مكان في العالم.
          </p>
        </div>

        {/* Features */}
        <div className="glass-card rounded-2xl overflow-hidden divide-y divide-border/50 animate-fade-in" style={{ animationDelay: "160ms", animationFillMode: "both" }}>
          {[
            { icon: Star, label: "جلسات إقراء مباشرة", desc: "تواصل مباشر مع المقرئين" },
            { icon: Code, label: "تقنية متقدمة", desc: "جودة صوت عالية وتجربة سلسة" },
            { icon: Heart, label: "مجتمع متعاون", desc: "بيئة تعليمية داعمة ومحفزة" },
          ].map((item, i) => (
            <div key={i} className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground text-sm">{item.label}</p>
                <p className="text-[10px] text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-4">© 2025 مُقرئ. جميع الحقوق محفوظة.</p>
      </div>
    </div>
  );
};

export default AboutApp;
