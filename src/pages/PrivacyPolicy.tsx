import { ChevronRight, FileText } from "lucide-react";
import { Link } from "react-router-dom";

const sections = [
  {
    title: "المقدمة",
    content: "نحن في منصة مُقرئ نلتزم بحماية خصوصيتك وبياناتك الشخصية. توضح هذه السياسة كيفية جمع واستخدام وحماية معلوماتك عند استخدام تطبيقنا.",
  },
  {
    title: "البيانات التي نجمعها",
    content: "نقوم بجمع البيانات الشخصية مثل الاسم والبريد الإلكتروني ورقم الهاتف عند التسجيل. كما نجمع بيانات استخدام التطبيق لتحسين تجربتك.",
  },
  {
    title: "كيف نستخدم بياناتك",
    content: "نستخدم بياناتك لتوفير خدمات التطبيق، جدولة الجلسات، إرسال الإشعارات المهمة، وتحسين تجربة المستخدم بشكل مستمر.",
  },
  {
    title: "حماية البيانات",
    content: "نتبع أعلى معايير الأمان لحماية بياناتك الشخصية من الوصول غير المصرح به أو التعديل أو الإفصاح أو الإتلاف.",
  },
  {
    title: "حقوقك",
    content: "يحق لك الوصول إلى بياناتك الشخصية وتعديلها أو حذفها في أي وقت. يمكنك أيضاً طلب نسخة من بياناتك المخزنة لدينا.",
  },
  {
    title: "التواصل",
    content: "لأي استفسارات حول سياسة الخصوصية، يرجى التواصل معنا عبر البريد الإلكتروني: privacy@muqri.app",
  },
];

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      {/* Header */}
      <div className="gradient-primary px-6 pt-8 pb-5 rounded-b-[2.5rem] text-center relative">
        <Link to="/profile" className="absolute right-4 top-8">
          <ChevronRight className="w-6 h-6 text-primary-foreground" />
        </Link>
        <div className="flex items-center justify-center gap-2">
          <FileText className="w-6 h-6 text-primary-foreground" />
          <h1 className="text-xl font-bold text-primary-foreground">سياسة الخصوصية</h1>
        </div>
        <p className="text-primary-foreground/70 text-sm mt-1">الشروط والأحكام</p>
      </div>

      <div className="px-5 mt-6 space-y-4">
        {sections.map((section, i) => (
          <div
            key={i}
            className="glass-card rounded-2xl p-5 animate-fade-in"
            style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
          >
            <h3 className="font-bold text-foreground text-sm mb-2">{section.title}</h3>
            <p className="text-[12px] text-muted-foreground leading-relaxed">{section.content}</p>
          </div>
        ))}

        <p className="text-center text-[10px] text-muted-foreground mt-4">آخر تحديث: يناير 2025</p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
