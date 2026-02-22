import { QRCodeSVG } from "qrcode.react";
import logoMojaz from "@/assets/logo-mojaz.webp";

interface CertificateViewerProps {
  cert: {
    id: string;
    title: string;
    type: string;
    student_name: string | null;
    reciter_name: string | null;
    sheikh_name: string | null;
    riwaya: string | null;
    date: string | null;
    certificate_text: string | null;
    student_phone: string | null;
    student_email: string | null;
    status: string;
    notes: string | null;
  };
  reciterSignatureUrl?: string | null;
  reciterStampUrl?: string | null;
}

const CertificateViewer = ({ cert, reciterSignatureUrl, reciterStampUrl }: CertificateViewerProps) => {
  const isIjaza = cert.type === "ijaza";
  const verificationUrl = `${window.location.origin}/verify/${cert.id}`;

  return (
    <div className="w-full overflow-x-auto py-4" dir="rtl">
      {/* Certificate - Landscape */}
      <div
        className="relative mx-auto bg-[#fefcf3] shadow-2xl"
        style={{
          width: "900px",
          minHeight: "620px",
          aspectRatio: "900 / 620",
        }}
      >
        {/* Outer decorative border */}
        <div className="absolute inset-0 border-[6px] border-double" style={{ borderColor: isIjaza ? "#b8860b" : "#0d7377" }} />
        <div className="absolute inset-[10px] border-[2px]" style={{ borderColor: isIjaza ? "#d4a84420" : "#0d737720" }} />
        <div className="absolute inset-[14px] border-[1px] border-dashed" style={{ borderColor: isIjaza ? "#d4a84440" : "#0d737740" }} />

        {/* Corner decorations */}
        {[
          "top-[18px] right-[18px]",
          "top-[18px] left-[18px] -scale-x-100",
          "bottom-[18px] right-[18px] -scale-y-100",
          "bottom-[18px] left-[18px] -scale-x-100 -scale-y-100",
        ].map((pos, i) => (
          <div key={i} className={`absolute ${pos} w-12 h-12`}>
            <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 5 L5 20 Q5 5 20 5 Z" fill={isIjaza ? "#b8860b" : "#0d7377"} opacity="0.4" />
              <path d="M5 5 L5 30 Q5 5 30 5" stroke={isIjaza ? "#b8860b" : "#0d7377"} strokeWidth="1" fill="none" opacity="0.3" />
            </svg>
          </div>
        ))}

        {/* Watermark pattern */}
        <div className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 L35 20 L50 20 L38 30 L42 45 L30 36 L18 45 L22 30 L10 20 L25 20 Z' fill='%23${isIjaza ? 'b8860b' : '0d7377'}' opacity='0.3'/%3E%3C/svg%3E")`,
            backgroundSize: "80px 80px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-between h-full px-16 py-10">
          {/* Header: Logo + Bismillah */}
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="flex items-center justify-between w-full mb-1">
              <img src={logoMojaz} alt="مجاز" className="h-12 w-12 rounded-xl object-cover" />
              <div className="text-center flex-1">
                <p className="text-sm font-bold" style={{ color: isIjaza ? "#b8860b" : "#0d7377", fontFamily: "serif" }}>
                  بسم الله الرحمن الرحيم
                </p>
              </div>
              <div className="h-12 w-12" /> {/* Spacer */}
            </div>

            {/* Title */}
            <div className="text-center mt-1">
              <h1
                className="text-3xl font-black tracking-wide"
                style={{
                  color: isIjaza ? "#8B6914" : "#0a5c5f",
                  textShadow: "0 1px 2px rgba(0,0,0,0.08)",
                }}
              >
                {cert.title}
              </h1>
              <div
                className="mx-auto mt-2 w-48 h-[2px] rounded-full"
                style={{
                  background: isIjaza
                    ? "linear-gradient(90deg, transparent, #b8860b, transparent)"
                    : "linear-gradient(90deg, transparent, #0d7377, transparent)",
                }}
              />
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-3 mt-5 w-full max-w-[680px]">
            {[
              { label: "الطالب/ة", value: cert.student_name },
              { label: "المقرئ/ة", value: cert.reciter_name || cert.sheikh_name },
              { label: "الرواية", value: cert.riwaya },
              { label: "التاريخ", value: cert.date },
            ].filter(item => item.value).map((item) => (
              <div key={item.label} className="flex items-baseline gap-2">
                <span className="text-xs font-bold" style={{ color: isIjaza ? "#b8860b" : "#0d7377" }}>
                  {item.label}:
                </span>
                <span className="text-sm font-semibold text-gray-800">{item.value}</span>
              </div>
            ))}
          </div>

          {/* Certificate Text */}
          {cert.certificate_text && (
            <div
              className="mt-4 px-6 py-4 rounded-xl text-center max-w-[700px] w-full"
              style={{
                background: isIjaza
                  ? "linear-gradient(135deg, #fdf8e8, #fef9ed)"
                  : "linear-gradient(135deg, #f0fafb, #f5fcfc)",
                border: `1px solid ${isIjaza ? "#d4a84430" : "#0d737720"}`,
              }}
            >
              <p className="text-sm leading-[2] text-gray-700 font-medium" style={{ fontFamily: "serif" }}>
                {cert.certificate_text}
              </p>
            </div>
          )}

          {/* Footer: Signature, Stamp, QR */}
          <div className="flex items-end justify-between w-full mt-6 pt-4 border-t" style={{ borderColor: isIjaza ? "#d4a84430" : "#0d737720" }}>
            {/* QR Code */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="p-2 bg-white rounded-lg border" style={{ borderColor: isIjaza ? "#d4a84440" : "#0d737740" }}>
                <QRCodeSVG
                  value={verificationUrl}
                  size={72}
                  level="M"
                  fgColor={isIjaza ? "#8B6914" : "#0a5c5f"}
                  bgColor="transparent"
                />
              </div>
              <p className="text-[8px] text-gray-400">للتحقق من صحة الشهادة</p>
            </div>

            {/* Issuer */}
            <div className="text-center flex-1 px-6">
              <p className="text-xs text-gray-500 mb-1">صادرة من</p>
              <p className="text-sm font-bold" style={{ color: isIjaza ? "#8B6914" : "#0a5c5f" }}>
                منصة مجاز لإقراء القرآن الكريم
              </p>
              <div
                className="mx-auto mt-1.5 w-24 h-[1px]"
                style={{
                  background: isIjaza
                    ? "linear-gradient(90deg, transparent, #b8860b, transparent)"
                    : "linear-gradient(90deg, transparent, #0d7377, transparent)",
                }}
              />
            </div>

            {/* Stamp + Signature */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-3">
                {reciterSignatureUrl && (
                  <div className="flex flex-col items-center">
                    <img
                      src={reciterSignatureUrl}
                      alt="توقيع المقرئ"
                      className="h-14 w-auto object-contain opacity-80"
                    />
                    <p className="text-[8px] text-gray-400 mt-0.5">التوقيع</p>
                  </div>
                )}
                {reciterStampUrl && (
                  <div className="flex flex-col items-center">
                    <img
                      src={reciterStampUrl}
                      alt="ختم المقرئ"
                      className="h-16 w-16 object-contain opacity-70"
                    />
                    <p className="text-[8px] text-gray-400 mt-0.5">الختم</p>
                  </div>
                )}
              </div>
              {!reciterSignatureUrl && !reciterStampUrl && (
                <div className="flex flex-col items-center">
                  <div className="w-20 h-12 border-b-2 border-dashed" style={{ borderColor: isIjaza ? "#d4a84460" : "#0d737740" }} />
                  <p className="text-[9px] text-gray-400 mt-1">التوقيع والختم</p>
                </div>
              )}
            </div>
          </div>

          {/* Certificate ID */}
          <p className="text-[8px] text-gray-300 mt-2 tracking-widest">
            رقم الشهادة: {cert.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CertificateViewer;
