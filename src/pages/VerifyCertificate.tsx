import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, ShieldCheck } from "lucide-react";
import associationLogo from "@/assets/eqraa-association-logo.jpg";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

interface CertRow {
  id: string;
  title: string;
  type: string;
  riwaya: string | null;
  date: string | null;
  student_name: string | null;
  reciter_name: string | null;
  sheikh_name: string | null;
  issuer: string | null;
  issued_by: string | null;
  certificate_text: string | null;
  status: string;
  created_at: string;
}

const formatDate = (d: string | null) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return d;
  }
};

export default function VerifyCertificate() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState<CertRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setError("معرّف الإجازة غير موجود");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/verify-certificate?id=${encodeURIComponent(id)}`,
          {
            headers: {
              apikey: SUPABASE_ANON,
              Authorization: `Bearer ${SUPABASE_ANON}`,
            },
          }
        );
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error === "not_found" ? "الإجازة غير موجودة" : "تعذّر التحقق من الإجازة");
        } else {
          setCert(data.certificate as CertRow);
        }
      } catch {
        setError("حدث خطأ في الاتصال");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full flex items-center justify-center px-4 py-10"
      style={{
        background:
          "linear-gradient(135deg, #f6fbf8 0%, #eef7f3 50%, #fff8ec 100%)",
        fontFamily: "'Cairo', 'Amiri', system-ui, sans-serif",
      }}
    >
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <img
            src={associationLogo}
            alt="جمعية إقراء القرآن الكريم"
            className="w-28 h-28 object-contain mb-3"
          />
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-900">
            جمعية إقراء القرآن الكريم
          </h1>
          <p className="text-emerald-700 mt-1 text-sm md:text-base">
            صفحة التحقق الرسمية من الإجازات الصادرة عبر منصة مجاز
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 overflow-hidden">
          {loading && (
            <div className="p-12 flex flex-col items-center text-emerald-700">
              <Loader2 className="w-10 h-10 animate-spin mb-3" />
              <p>جاري التحقق من الإجازة...</p>
            </div>
          )}

          {!loading && error && (
            <div className="p-10 flex flex-col items-center text-center">
              <XCircle className="w-16 h-16 text-red-500 mb-3" />
              <h2 className="text-xl font-bold text-red-700 mb-2">
                لم نتمكن من التحقق
              </h2>
              <p className="text-gray-600">{error}</p>
              {id && (
                <p className="mt-4 text-xs text-gray-400 font-mono">رقم: {id}</p>
              )}
            </div>
          )}

          {!loading && cert && (
            <>
              {/* Status banner */}
              <div
                className={`flex items-center justify-center gap-2 py-3 px-4 ${
                  cert.status === "issued" || cert.status === "active"
                    ? "bg-emerald-600 text-white"
                    : "bg-amber-500 text-white"
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-bold">
                  إجازة موثّقة وصادرة من جمعية إقراء القرآن الكريم
                </span>
              </div>

              <div className="p-6 md:p-8 space-y-5">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-emerald-900">
                    {cert.title}
                  </h2>
                  {cert.riwaya && (
                    <p className="text-emerald-700 mt-1 text-sm">
                      برواية: {cert.riwaya}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <Field label="اسم الطالب/ة" value={cert.student_name} />
                  <Field label="اسم المقرئ/ة" value={cert.reciter_name} />
                  <Field label="الشيخ المُجيز" value={cert.sheikh_name} />
                  <Field label="نوع الإجازة" value={cert.type === "ijaza" ? "إجازة قرآنية" : "شهادة ختم"} />
                  <Field label="تاريخ الإصدار" value={formatDate(cert.date || cert.created_at)} />
                  <Field label="جهة الإصدار" value={cert.issuer || "جمعية إقراء القرآن الكريم"} />
                </div>

                {cert.certificate_text && (
                  <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 md:p-5 mt-4">
                    <p className="text-xs text-emerald-700 font-bold mb-2">
                      نص الإجازة
                    </p>
                    <p
                      className="text-gray-800 leading-loose text-justify"
                      style={{ fontFamily: "'Amiri', 'Cairo', serif" }}
                    >
                      {cert.certificate_text}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 text-emerald-700 text-xs pt-3 border-t border-gray-100">
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    رقم الإجازة:{" "}
                    <span className="font-mono font-bold">
                      {cert.id.slice(0, 8).toUpperCase()}
                    </span>
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          © جمعية إقراء القرآن الكريم — منصة مجاز
        </p>
      </div>
    </div>
  );
}

const Field = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <p className="font-bold text-gray-900">{value || "—"}</p>
  </div>
);
