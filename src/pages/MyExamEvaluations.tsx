import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Award } from "lucide-react";
import { ExamEvaluationsSection } from "@/components/exam-evaluation/ExamEvaluationsSection";

const MyExamEvaluations = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      <div className="gradient-primary px-6 pt-10 pb-8 rounded-b-[2rem] relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-10 right-5 w-10 h-10 rounded-full bg-white/15 flex items-center justify-center"
        >
          <ArrowRight className="w-5 h-5 text-primary-foreground" />
        </button>
        <div className="text-center pt-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/20 flex items-center justify-center mb-2">
            <Award className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-bold text-primary-foreground">تقييماتي في الاختبارات</h1>
          <p className="text-xs text-primary-foreground/80 mt-1">اختبارات القبول والاستحقاق</p>
        </div>
      </div>

      <div className="px-5 mt-5">
        {user && <ExamEvaluationsSection studentId={user.id} title="جميع تقييماتك" />}
      </div>
    </div>
  );
};

export default MyExamEvaluations;
