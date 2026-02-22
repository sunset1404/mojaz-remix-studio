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
    const accentDark = isIjaza ? "#8B6914" : primaryDark;
    const accentColor = isIjaza ? goldColor : primaryColor;

    // Scale font sizes proportionally to render width
    const scale = renderWidth / 920;
    const fs = (px: number) => `${Math.round(px * scale)}px`;

    return (
      <div className="w-full overflow-x-auto" dir="rtl">
        <div className="w-full flex justify-center">
          <div
            ref={ref}
            className="relative overflow-hidden"
            style={{
              width: `${renderWidth}px`,
              background: "linear-gradient(145deg, #fefefe, #f8fafa)",
              boxShadow: "0 25px 60px -15px rgba(13,115,119,0.15), 0 10px 30px -10px rgba(0,0,0,0.1)",
            }}
          >
            {/* Top accent bar */}
            <div style={{ height: `${Math.max(3, 4 * scale)}px`, width: "100%", background: `linear-gradient(90deg, ${primaryColor}, ${goldColor}, ${primaryColor})` }} />

            {/* Right decorative stripe */}
            <div className="absolute top-0 right-0 h-full" style={{ width: `${Math.max(2, 3 * scale)}px`, background: `linear-gradient(180deg, ${primaryColor}, ${goldColor})` }} />

            {/* Corner ornaments */}
            {[
              { pos: "top-4 left-4", rotate: "" },
              { pos: "top-4 right-4", rotate: "scale-x-[-1]" },
              { pos: "bottom-4 left-4", rotate: "scale-y-[-1]" },
              { pos: "bottom-4 right-4", rotate: "scale-[-1]" },
            ].map((c, i) => (
              <div key={i} className={`absolute ${c.pos} ${c.rotate}`}>
                <svg width={Math.round(40 * scale)} height={Math.round(40 * scale)} viewBox="0 0 50 50" fill="none">
                  <path d="M0 0 L0 22 Q0 0 22 0 Z" fill={primaryColor} opacity="0.12" />
                  <path d="M0 0 L0 35 Q0 0 35 0" stroke={goldColor} strokeWidth="1.5" fill="none" opacity="0.3" />
                  <circle cx="3" cy="3" r="2" fill={goldColor} opacity="0.35" />
                </svg>
              </div>
            ))}

            {/* Watermark */}
            <div
              className="absolute inset-0 opacity-[0.015]"
              style={{
                backgroundImage: `radial-gradient(circle, ${primaryColor} 1px, transparent 1px)`,
                backgroundSize: "30px 30px",
              }}
            />

            {/* Content - minimal padding */}
            <div className="relative z-10 flex flex-col" style={{ padding: `${Math.round(12 * scale)}px ${Math.round(16 * scale)}px` }}>
              
              {/* Header row: Logo centered */}
              <div className="flex items-center justify-center w-full" style={{ marginBottom: fs(8) }}>
                <div className="flex items-center" style={{ gap: fs(6) }}>
                  <img src={logoMojaz} alt="مجاز" style={{ height: fs(40), width: fs(40), borderRadius: fs(10), objectFit: "cover" }} />
                  <div className="text-right">
                    <p style={{ fontSize: fs(11), fontWeight: 700, color: primaryDark, margin: 0 }}>منصة مجاز</p>
                    <p style={{ fontSize: fs(8), color: primaryColor, margin: 0 }}>لإقراء القرآن الكريم</p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center justify-center" style={{ gap: fs(6), marginBottom: fs(6) }}>
                <div style={{ flex: 1, maxWidth: fs(80), height: "1px", background: `linear-gradient(90deg, transparent, ${goldColor})` }} />
                <svg width={fs(10)} height={fs(10)} viewBox="0 0 16 16" fill="none">
                  <path d="M8 0 L10 6 L16 8 L10 10 L8 16 L6 10 L0 8 L6 6 Z" fill={goldColor} opacity="0.5" />
                </svg>
                <div style={{ flex: 1, maxWidth: fs(80), height: "1px", background: `linear-gradient(90deg, ${goldColor}, transparent)` }} />
              </div>

              {/* Title */}
              <h1
                style={{
                  fontSize: fs(24),
                  fontWeight: 900,
                  color: accentDark,
                  textAlign: "center",
                  margin: `0 0 ${fs(4)} 0`,
                  textShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  letterSpacing: "0.02em",
                }}
              >
                {cert.title}
              </h1>

              {/* Underline */}
              <div className="flex items-center justify-center" style={{ gap: fs(4), marginBottom: fs(8) }}>
                <div style={{ width: fs(40), height: "2px", borderRadius: "2px", background: `linear-gradient(90deg, transparent, ${accentColor})` }} />
                <div style={{ width: fs(5), height: fs(5), borderRadius: "50%", backgroundColor: goldColor, opacity: 0.5 }} />
                <div style={{ width: fs(40), height: "2px", borderRadius: "2px", background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />
              </div>

              {/* Details Grid - single row */}
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginBottom: fs(8), flexWrap: "wrap", gap: fs(4) }}>
                {[
                  { label: "الطالب/ة", value: cert.student_name },
                  { label: "المقرئ/ة", value: cert.reciter_name || cert.sheikh_name },
                  { label: "الرواية", value: cert.riwaya },
                  { label: "التاريخ", value: cert.date },
                ]
                  .filter((item) => item.value)
                  .map((item) => (
                    <div key={item.label} style={{ display: "flex", alignItems: "baseline", gap: fs(4) }}>
                      <span style={{ fontSize: fs(11), fontWeight: 700, color: primaryColor }}>{item.label}:</span>
                      <span style={{ fontSize: fs(12), fontWeight: 600, color: "#333" }}>{item.value}</span>
                    </div>
                  ))}
              </div>

              {/* Certificate Text - full width, larger font */}
              {cert.certificate_text && (
                <div
                  style={{
                    width: "100%",
                    borderRadius: fs(10),
                    padding: `${fs(10)} ${fs(12)}`,
                    marginBottom: fs(8),
                    background: `linear-gradient(135deg, rgba(13,115,119,0.03), rgba(184,134,11,0.03))`,
                    border: `1px solid rgba(13,115,119,0.08)`,
                    flex: 1,
                  }}
                >
                  <p style={{
                    fontSize: fs(13),
                    lineHeight: 2,
                    textAlign: "justify",
                    fontWeight: 500,
                    color: "#333",
                    fontFamily: "'Amiri', serif",
                    margin: 0,
                  }}>
                    {cert.certificate_text}
                  </p>
                </div>
              )}

              {/* Footer */}
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", width: "100%", marginTop: "auto", paddingTop: fs(6) }}>
                {/* Stamp + Signature */}
                <div style={{ display: "flex", alignItems: "flex-end", gap: fs(8) }}>
                  {reciterSignatureUrl && (
                    <div className="flex flex-col items-center">
                      <img src={reciterSignatureUrl} alt="توقيع المقرئ" style={{ height: fs(36), width: "auto", objectFit: "contain", opacity: 0.8 }} />
                      <p style={{ fontSize: fs(7), marginTop: fs(2), color: primaryColor }}>التوقيع</p>
                    </div>
                  )}
                  {reciterStampUrl && (
                    <div className="flex flex-col items-center">
                      <img src={reciterStampUrl} alt="ختم المقرئ" style={{ height: fs(40), width: fs(40), objectFit: "contain", opacity: 0.75 }} />
                      <p style={{ fontSize: fs(7), marginTop: fs(2), color: primaryColor }}>الختم</p>
                    </div>
                  )}
                  {!reciterSignatureUrl && !reciterStampUrl && (
                    <div className="flex flex-col items-center">
                      <div style={{ width: fs(60), height: fs(30), borderBottom: `2px dashed ${primaryColor}40` }} />
                      <p style={{ fontSize: fs(7), marginTop: fs(3), color: `${primaryColor}80` }}>التوقيع والختم</p>
                    </div>
                  )}
                </div>

                {/* Center - Issuer */}
                <div style={{ textAlign: "center", flex: 1, padding: `0 ${fs(8)}` }}>
                  <div style={{ display: "inline-block", padding: `${fs(4)} ${fs(10)}`, borderRadius: fs(8), background: `linear-gradient(135deg, rgba(13,115,119,0.06), rgba(184,134,11,0.06))` }}>
                    <p style={{ fontSize: fs(8), marginBottom: fs(1), color: "#999" }}>صادرة من</p>
                    <p style={{ fontSize: fs(11), fontWeight: 700, color: primaryDark, margin: 0 }}>منصة مجاز لإقراء القرآن الكريم</p>
                  </div>
                  <p style={{ fontSize: fs(6), marginTop: fs(3), letterSpacing: "0.15em", color: "#bbb" }}>رقم الشهادة: {cert.id.slice(0, 8).toUpperCase()}</p>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center" style={{ gap: fs(2) }}>
                  <div style={{ padding: fs(4), borderRadius: fs(8), background: "white", border: `1.5px solid ${primaryColor}25`, boxShadow: `0 4px 12px ${primaryColor}10` }}>
                    <QRCodeSVG value={verificationUrl} size={Math.round(50 * scale)} level="M" fgColor={primaryDark} bgColor="transparent" />
                  </div>
                  <p style={{ fontSize: fs(6), color: primaryColor }}>للتحقق من صحة الشهادة</p>
                </div>
              </div>
            </div>

            {/* Bottom accent bar */}
            <div className="absolute bottom-0 left-0 right-0" style={{ height: `${Math.max(2, 3 * scale)}px`, background: `linear-gradient(90deg, ${primaryColor}, ${goldColor}, ${primaryColor})` }} />
          </div>
        </div>
      </div>
    );
  }
);

CertificateViewer.displayName = "CertificateViewer";

export default CertificateViewer;
