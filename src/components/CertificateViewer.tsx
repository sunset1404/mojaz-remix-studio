import { QRCodeSVG } from "qrcode.react";
import { forwardRef } from "react";
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
  renderWidth?: number;
}

const CertificateViewer = forwardRef<HTMLDivElement, CertificateViewerProps>(
  ({ cert, reciterSignatureUrl, reciterStampUrl, renderWidth = 920 }, ref) => {
    const isIjaza = cert.type === "ijaza";
    const verificationUrl = `${window.location.origin}/verify/${cert.id}`;

    const primaryColor = "#0d7377";
    const primaryDark = "#0a5c5f";
    const goldColor = "#b8860b";
    const goldLight = "#d4a844";
    const accentDark = isIjaza ? "#8B6914" : primaryDark;
    const accentColor = isIjaza ? goldColor : primaryColor;

    return (
      <div className="w-full overflow-x-auto py-2" dir="rtl">
        {/* Scaled wrapper for mobile */}
        <div className="w-full flex justify-center">
          <div
            ref={ref}
            className="relative overflow-hidden origin-top-right"
            style={{
              width: `${renderWidth}px`,
              minHeight: "auto",
              background: "linear-gradient(145deg, #fefefe, #f8fafa)",
              boxShadow: "0 25px 60px -15px rgba(13,115,119,0.15), 0 10px 30px -10px rgba(0,0,0,0.1)",
            }}
          >
            {/* Top accent bar */}
            <div className="h-3 w-full" style={{ background: `linear-gradient(90deg, ${primaryColor}, ${goldColor}, ${primaryColor})` }} />

            {/* Left decorative stripe */}
            <div className="absolute top-0 right-0 w-2 h-full" style={{ background: `linear-gradient(180deg, ${primaryColor}, ${goldColor})` }} />

            {/* Corner geometric ornaments */}
            {[
              { pos: "top-6 left-6", rotate: "" },
              { pos: "top-6 right-6", rotate: "scale-x-[-1]" },
              { pos: "bottom-6 left-6", rotate: "scale-y-[-1]" },
              { pos: "bottom-6 right-6", rotate: "scale-[-1]" },
            ].map((c, i) => (
              <div key={i} className={`absolute ${c.pos} ${c.rotate}`}>
                <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
                  <path d="M0 0 L0 22 Q0 0 22 0 Z" fill={primaryColor} opacity="0.12" />
                  <path d="M0 0 L0 35 Q0 0 35 0" stroke={goldColor} strokeWidth="1.5" fill="none" opacity="0.3" />
                  <path d="M0 0 L0 15 Q0 0 15 0" stroke={primaryColor} strokeWidth="1" fill="none" opacity="0.2" />
                  <circle cx="3" cy="3" r="2" fill={goldColor} opacity="0.35" />
                </svg>
              </div>
            ))}

            {/* Subtle watermark pattern */}
            <div
              className="absolute inset-0 opacity-[0.015]"
              style={{
                backgroundImage: `radial-gradient(circle, ${primaryColor} 1px, transparent 1px)`,
                backgroundSize: "30px 30px",
              }}
            />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center px-8 py-6 h-full">
              {/* Header - Logo */}
              <div className="flex items-center justify-center w-full mb-3">
                <div className="flex items-center gap-3">
                  <img src={logoMojaz} alt="مجاز" className="h-14 w-14 rounded-2xl object-cover shadow-md" />
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: primaryDark }}>منصة مجاز</p>
                    <p className="text-[10px]" style={{ color: primaryColor }}>لإقراء القرآن الكريم</p>
                  </div>
                </div>
              </div>

              {/* Decorative divider */}
              <div className="flex items-center gap-3 w-64 mb-2">
                <div className="flex-1 h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${goldColor})` }} />
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 0 L10 6 L16 8 L10 10 L8 16 L6 10 L0 8 L6 6 Z" fill={goldColor} opacity="0.5" />
                </svg>
                <div className="flex-1 h-[1px]" style={{ background: `linear-gradient(90deg, ${goldColor}, transparent)` }} />
              </div>

              {/* Title */}
              <h1
                className="text-3xl font-black mb-1 tracking-wide text-center"
                style={{ color: accentDark, textShadow: "0 2px 4px rgba(0,0,0,0.06)" }}
              >
                {cert.title}
              </h1>

              {/* Underline */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-16 h-[2px] rounded-full" style={{ background: `linear-gradient(90deg, transparent, ${accentColor})` }} />
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: goldColor, opacity: 0.5 }} />
                <div className="w-16 h-[2px] rounded-full" style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-x-16 gap-y-3 w-full mb-4">
                {[
                  { label: "الطالب/ة", value: cert.student_name },
                  { label: "المقرئ/ة", value: cert.reciter_name || cert.sheikh_name },
                  { label: "الرواية", value: cert.riwaya },
                  { label: "التاريخ", value: cert.date },
                ]
                  .filter((item) => item.value)
                  .map((item) => (
                    <div key={item.label} className="flex items-baseline gap-2">
                      <span className="text-xs font-bold" style={{ color: primaryColor }}>{item.label}:</span>
                      <span className="text-sm font-semibold" style={{ color: "#333" }}>{item.value}</span>
                    </div>
                  ))}
              </div>

              {/* Certificate Text */}
              {cert.certificate_text && (
                <div
                  className="w-full rounded-2xl px-4 py-4 mb-4"
                  style={{
                    background: `linear-gradient(135deg, rgba(13,115,119,0.04), rgba(184,134,11,0.04))`,
                    border: `1px solid rgba(13,115,119,0.1)`,
                  }}
                >
                  <p className="text-base leading-[2.2] text-justify font-medium" style={{ color: "#444", fontFamily: "'Amiri', serif" }}>
                    {cert.certificate_text}
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-end justify-between w-full mt-auto pt-5">
                {/* Stamp + Signature */}
                <div className="flex items-end gap-4">
                  {reciterSignatureUrl && (
                    <div className="flex flex-col items-center">
                      <img src={reciterSignatureUrl} alt="توقيع المقرئ" className="h-14 w-auto object-contain" style={{ opacity: 0.8 }} />
                      <p className="text-[9px] mt-1" style={{ color: primaryColor }}>التوقيع</p>
                    </div>
                  )}
                  {reciterStampUrl && (
                    <div className="flex flex-col items-center">
                      <img src={reciterStampUrl} alt="ختم المقرئ" className="h-16 w-16 object-contain" style={{ opacity: 0.75 }} />
                      <p className="text-[9px] mt-1" style={{ color: primaryColor }}>الختم</p>
                    </div>
                  )}
                  {!reciterSignatureUrl && !reciterStampUrl && (
                    <div className="flex flex-col items-center">
                      <div className="w-24 h-14 border-b-2 border-dashed" style={{ borderColor: `${primaryColor}40` }} />
                      <p className="text-[9px] mt-1.5" style={{ color: `${primaryColor}80` }}>التوقيع والختم</p>
                    </div>
                  )}
                </div>

                {/* Center - Issuer */}
                <div className="text-center flex-1 px-4">
                  <div className="inline-block px-5 py-2 rounded-xl" style={{ background: `linear-gradient(135deg, rgba(13,115,119,0.06), rgba(184,134,11,0.06))` }}>
                    <p className="text-[10px] mb-0.5" style={{ color: "#999" }}>صادرة من</p>
                    <p className="text-sm font-bold" style={{ color: primaryDark }}>منصة مجاز لإقراء القرآن الكريم</p>
                  </div>
                  <p className="text-[8px] mt-2 tracking-[0.2em]" style={{ color: "#bbb" }}>رقم الشهادة: {cert.id.slice(0, 8).toUpperCase()}</p>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center gap-1">
                  <div className="p-2.5 rounded-xl" style={{ background: "white", border: `1.5px solid ${primaryColor}25`, boxShadow: `0 4px 12px ${primaryColor}10` }}>
                    <QRCodeSVG value={verificationUrl} size={76} level="M" fgColor={primaryDark} bgColor="transparent" />
                  </div>
                  <p className="text-[8px]" style={{ color: primaryColor }}>للتحقق من صحة الشهادة</p>
                </div>
              </div>
            </div>

            {/* Bottom accent bar */}
            <div className="absolute bottom-0 left-0 right-0 h-2" style={{ background: `linear-gradient(90deg, ${primaryColor}, ${goldColor}, ${primaryColor})` }} />
          </div>
        </div>
      </div>
    );
  }
);

CertificateViewer.displayName = "CertificateViewer";

export default CertificateViewer;
