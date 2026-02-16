import { ChevronRight, Info, Phone, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import logoMojaz from "@/assets/logo-mojaz.webp";
import logoEqraa from "@/assets/logo-eqraa.jpg";

const socialLinks = [
  { name: "X", url: "https://x.com/eqraalquran1", icon: (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
  )},
  { name: "TikTok", url: "https://www.tiktok.com/@eqraalquran?_t=8WFXhDrEsqH&_r=1", icon: (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.75a8.18 8.18 0 004.77 1.52V6.82a4.84 4.84 0 01-1-.13z"/></svg>
  )},
  { name: "YouTube", url: "https://www.youtube.com/channel/UCIQIk0zRJOSolkwMfL4OlhA", icon: (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
  )},
  { name: "Instagram", url: "https://www.instagram.com/eqraalquran1/", icon: (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
  )},
  { name: "Facebook", url: "https://www.facebook.com/eqraa.org.sa/", icon: (
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
  )},
];

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
          <img src={logoMojaz} alt="شعار مجاز" className="w-24 h-28 object-contain mx-auto mb-4" />
          <h2 className="text-lg font-bold text-foreground">مجاز</h2>
          <p className="text-sm text-muted-foreground mt-1">إجازات قرآنية بالسند المتصل</p>
          <p className="text-[10px] text-muted-foreground mt-2">الإصدار 1.0.0</p>
        </div>

        {/* Eqraa Association */}
        <div className="glass-card rounded-2xl p-6 text-center animate-fade-in" style={{ animationDelay: "80ms", animationFillMode: "both" }}>
          <img src={logoEqraa} alt="شعار جمعية إقراء" className="w-24 h-24 object-contain mx-auto mb-4 rounded-xl" />
          <h3 className="font-bold text-foreground text-base mb-2">جمعية إقراء القرآن الكريم</h3>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            جمعية إقراء القرآن الكريم بمكة المكرمة، جمعية أهلية متخصصة في تعليم القرآن الكريم وإقرائه بالسند المتصل. تسعى الجمعية إلى نشر القرآن الكريم وخدمة كتاب الله من خلال برامج متنوعة ومبتكرة تخدم طلاب العلم في مختلف أنحاء العالم.
          </p>
        </div>

        {/* Contact Info */}
        <div className="glass-card rounded-2xl overflow-hidden divide-y divide-border/50 animate-fade-in" style={{ animationDelay: "160ms", animationFillMode: "both" }}>
          <a href="https://iwtsp.com/966507040036" target="_blank" rel="noopener noreferrer" className="p-4 flex items-center gap-3 hover:bg-muted/30 transition-all active:scale-[0.98] block">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground text-sm">واتساب</p>
              <p className="text-[10px] text-muted-foreground">تواصل عبر واتساب</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground rotate-180" />
          </a>
          <a href="tel:0115205446" className="p-4 flex items-center gap-3 hover:bg-muted/30 transition-all active:scale-[0.98] block">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground text-sm">الرقم الموحد</p>
              <p className="text-[10px] text-muted-foreground">0115205446</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground rotate-180" />
          </a>
        </div>

        {/* Social Media */}
        <div className="glass-card rounded-2xl p-5 animate-fade-in" style={{ animationDelay: "240ms", animationFillMode: "both" }}>
          <h3 className="font-bold text-foreground text-sm mb-4 text-center">تابعونا على وسائل التواصل</h3>
          <div className="flex items-center justify-center gap-3">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-all active:scale-95"
                aria-label={social.name}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-4">© 2025 مجاز - جمعية إقراء القرآن الكريم بمكة المكرمة. جميع الحقوق محفوظة.</p>
      </div>
    </div>
  );
};

export default AboutApp;
