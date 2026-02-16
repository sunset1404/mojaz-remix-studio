import { ChevronRight, Share2, Copy, MessageCircle, Link2, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import logoMojaz from "@/assets/logo-mojaz.webp";

const APP_LINK = "https://mojaz.app";
const SHARE_TEXT = `✨ تطبيق مجاز - سند متصل بالسماء ✨

احصل على إجازتك القرآنية بالسند المتصل من خلال نخبة من المقرئين المجازين، أينما كنت في العالم.

🎯 جلسات إقراء مباشرة
📜 إجازات معتمدة بالسند المتصل
👨‍🏫 مقرئون مجازون ومعتمدون

حمّل التطبيق الآن:
${APP_LINK}`;

const ShareApp = () => {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(APP_LINK);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement("input");
      input.value = APP_LINK;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(SHARE_TEXT)}`, "_blank");
  };

  const shareNative = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "تطبيق مجاز", text: SHARE_TEXT });
      } else {
        shareWhatsApp();
      }
    } catch {
      // user cancelled
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      {/* Header */}
      <div className="gradient-primary px-6 pt-8 pb-5 rounded-b-[2.5rem] text-center relative">
        <Link to="/profile" className="absolute right-4 top-8">
          <ChevronRight className="w-6 h-6 text-primary-foreground" />
        </Link>
        <div className="flex items-center justify-center gap-2">
          <Share2 className="w-6 h-6 text-primary-foreground" />
          <h1 className="text-xl font-bold text-primary-foreground">مشاركة التطبيق</h1>
        </div>
        <p className="text-primary-foreground/70 text-sm mt-1">شارك مجاز مع أصدقائك</p>
      </div>

      <div className="px-5 mt-6 space-y-5">
        {/* App Preview Card */}
        <div className="glass-card rounded-2xl p-6 text-center animate-fade-in" style={{ animationFillMode: "both" }}>
          <img src={logoMojaz} alt="شعار مجاز" className="w-20 h-24 object-contain mx-auto mb-3" />
          <h2 className="text-lg font-bold text-foreground">مجاز</h2>
          <p className="text-sm text-muted-foreground mt-1">سند متصل بالسماء</p>
        </div>

        {/* Share Message Preview */}



        {/* Share Actions */}
        <div className="glass-card rounded-2xl overflow-hidden divide-y divide-border/50 animate-fade-in" style={{ animationDelay: "160ms", animationFillMode: "both" }}>
          {/* WhatsApp */}
          <button
            onClick={shareWhatsApp}
            className="p-4 flex items-center gap-3 w-full hover:bg-muted/30 transition-all active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5 text-gold" />
            </div>
            <div className="flex-1 text-right">
              <p className="font-semibold text-foreground text-sm">مشاركة عبر واتساب</p>
              <p className="text-[10px] text-muted-foreground">أرسل رسالة جاهزة لأصدقائك</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground rotate-180" />
          </button>

          {/* Copy Link */}
          <button
            onClick={copyLink}
            className="p-4 flex items-center gap-3 w-full hover:bg-muted/30 transition-all active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              {copied ? <Check className="w-5 h-5 text-gold" /> : <Link2 className="w-5 h-5 text-gold" />}
            </div>
            <div className="flex-1 text-right">
              <p className="font-semibold text-foreground text-sm">{copied ? "تم النسخ!" : "نسخ رابط التطبيق"}</p>
              <p className="text-[10px] text-muted-foreground">{APP_LINK}</p>
            </div>
            <Copy className="w-4 h-4 text-muted-foreground" />
          </button>

        </div>
      </div>
    </div>
  );
};

export default ShareApp;
