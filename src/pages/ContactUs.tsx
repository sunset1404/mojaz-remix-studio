import { ChevronRight, Headphones, Mail, Phone, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

const contactMethods = [
  {
    icon: Mail,
    label: "البريد الإلكتروني",
    desc: "support@muqri.app",
    action: "mailto:support@muqri.app",
  },
  {
    icon: Phone,
    label: "الهاتف",
    desc: "+966 50 000 0000",
    action: "tel:+966500000000",
  },
  {
    icon: MessageCircle,
    label: "واتساب",
    desc: "تواصل عبر واتساب",
    action: "https://wa.me/966500000000",
  },
];

const ContactUs = () => {
  return (
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      {/* Header */}
      <div className="gradient-primary px-6 pt-8 pb-5 rounded-b-[2.5rem] text-center relative">
        <Link to="/profile" className="absolute right-4 top-8">
          <ChevronRight className="w-6 h-6 text-primary-foreground" />
        </Link>
        <div className="flex items-center justify-center gap-2">
          <Headphones className="w-6 h-6 text-primary-foreground" />
          <h1 className="text-xl font-bold text-primary-foreground">تواصل معنا</h1>
        </div>
        <p className="text-primary-foreground/70 text-sm mt-1">الدعم الفني والاستفسارات</p>
      </div>

      {/* Contact Methods */}
      <div className="px-5 mt-6 space-y-3">
        <div className="glass-card rounded-2xl overflow-hidden divide-y divide-border/50">
          {contactMethods.map((item, i) => (
            <a
              key={item.label}
              href={item.action}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 flex items-center gap-3 w-full hover:bg-muted/30 transition-all active:scale-[0.98] animate-fade-in block"
              style={{ animationDelay: `${i * 40}ms`, animationFillMode: "both" }}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5 text-gold" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground text-sm">{item.label}</p>
                <p className="text-[10px] text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground rotate-180" />
            </a>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-6">
          <h2 className="text-sm font-bold text-foreground mb-3 px-1">الأسئلة الشائعة</h2>
          <div className="glass-card rounded-2xl overflow-hidden divide-y divide-border/50">
            {[
              { q: "كيف أحجز جلسة إقراء؟", a: "اختر المقرئ المناسب من قائمة المقرئين ثم اختر الموعد المتاح." },
              { q: "كيف أغير خطة الاشتراك؟", a: "من صفحة الاشتراكات يمكنك الترقية أو تغيير خطتك الحالية." },
              { q: "هل يمكنني استرجاع المبلغ؟", a: "نعم، يمكن استرجاع المبلغ خلال 7 أيام من الاشتراك." },
            ].map((faq, i) => (
              <div key={i} className="p-4 animate-fade-in" style={{ animationDelay: `${(i + 3) * 40}ms`, animationFillMode: "both" }}>
                <p className="font-semibold text-foreground text-sm">{faq.q}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
