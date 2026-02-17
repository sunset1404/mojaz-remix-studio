import { BookOpen } from "lucide-react";

const ReciterHome = () => {
  return (
    <div className="min-h-screen bg-background p-6 pb-24" dir="rtl">
      <div className="flex flex-col items-center justify-center mt-20 text-center gap-4">
        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">مرحباً بك أيها المقرئ</h1>
        <p className="text-muted-foreground">الصفحة الرئيسية للمقرئ - قيد التطوير</p>
      </div>
    </div>
  );
};

export default ReciterHome;
