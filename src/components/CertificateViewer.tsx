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
  /** Fixed width in px (default 920 for preview) */
  renderWidth?: number;
  /** If set, forces a fixed height – content fills this box (for PDF) */
  renderHeight?: number;
}

const CertificateViewer = forwardRef<HTMLDivElement, CertificateViewerProps>(
  ({ cert, reciterSignatureUrl, reciterStampUrl, renderWidth = 920, renderHeight }, ref) => {
    const isIjaza = cert.type === "ijaza";
    const verificationUrl = `${window.location.origin}/verify/${cert.id}`;

    const primaryColor = "#0d7377";
    const primaryDark = "#0a5c5f";
    const goldColor = "#b8860b";
    const accentDark = isIjaza ? "#8B6914" : primaryDark;
    const accentColor = isIjaza ? goldColor : primaryColor;

    const isLandscape = !!renderHeight;

    return (
      <div className="w-full overflow-x-auto" dir="rtl">
        <div className="w-full flex justify-center">
          <div
            ref={ref}
            className="relative overflow-hidden"
            style={{
              width: `${renderWidth}px`,
              height: renderHeight ? `${renderHeight}px` : "auto",
              background: "linear-gradient(145deg, #fefefe, #f8fafa)",
              boxShadow: "0 25px 60px -15px rgba(13,115,119,0.15), 0 10px 30px -10px rgba(0,0,0,0.1)",
            }}
          >
            {/* Top accent bar */}
            <div style={{ height: "4px", width: "100%", background: `linear-gradient(90deg, ${primaryColor}, ${goldColor}, ${primaryColor})` }} />

            {/* Right decorative stripe */}
            <div className="absolute top-0 right-0 h-full" style={{ width: "3px", background: `linear-gradient(180deg, ${primaryColor}, ${goldColor})` }} />

            {/* Corner ornaments */}
            {[
              { pos: "top-3 left-3", rotate: "" },
              { pos: "top-3 right-3", rotate: "scale-x-[-1]" },
              { pos: "bottom-3 left-3", rotate: "scale-y-[-1]" },
              { pos: "bottom-3 right-3", rotate: "scale-[-1]" },
            ].map((c, i) => (
              <div key={i} className={`absolute ${c.pos} ${c.rotate}`}>
                <svg width="36" height="36" viewBox="0 0 50 50" fill="none">
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

            {/* Content */}
            <div
              className="relative z-10 flex flex-col"
              style={{
                padding: isLandscape ? "10px 20px 8px 20px" : "12px 16px",
                height: renderHeight ? `${renderHeight - 8}px` : "auto",
              }}
            >
              {/* Header: Logo centered */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: isLandscape ? "4px" : "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <img src={logoMojaz} alt="مجاز" style={{ height: "36px", width: "36px", borderRadius: "8px", objectFit: "cover" }} />
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "11px", fontWeight: 700, color: primaryDark, margin: 0, lineHeight: 1.3 }}>منصة مجاز</p>
                    <p style={{ fontSize: "8px", color: primaryColor, margin: 0, lineHeight: 1.3 }}>لإقراء القرآن الكريم</p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginBottom: isLandscape ? "2px" : "6px" }}>
                <div style={{ flex: 1, maxWidth: "60px", height: "1px", background: `linear-gradient(90deg, transparent, ${goldColor})` }} />
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                  <path d="M8 0 L10 6 L16 8 L10 10 L8 16 L6 10 L0 8 L6 6 Z" fill={goldColor} opacity="0.5" />
                </svg>
                <div style={{ flex: 1, maxWidth: "60px", height: "1px", background: `linear-gradient(90deg, ${goldColor}, transparent)` }} />
              </div>

              {/* Title */}
              <h1 style={{
                fontSize: isLandscape ? "22px" : "24px",
                fontWeight: 900,
                color: accentDark,
                textAlign: "center",
                margin: `0 0 ${isLandscape ? "2px" : "4px"} 0`,
                textShadow: "0 1px 3px rgba(0,0,0,0.06)",
                lineHeight: 1.3,
              }}>
                {cert.title}
              </h1>

              {/* Underline */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", marginBottom: isLandscape ? "4px" : "8px" }}>
                <div style={{ width: "30px", height: "2px", borderRadius: "2px", background: `linear-gradient(90deg, transparent, ${accentColor})` }} />
                <div style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: goldColor, opacity: 0.5 }} />
                <div style={{ width: "30px", height: "2px", borderRadius: "2px", background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />
              </div>

              {/* Details - single row */}
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginBottom: isLandscape ? "6px" : "8px", flexWrap: "wrap", gap: "2px 8px" }}>
                {[
                  { label: "الطالب/ة", value: cert.student_name },
                  { label: "المقرئ/ة", value: cert.reciter_name || cert.sheikh_name },
                  { label: "الرواية", value: cert.riwaya },
                  { label: "التاريخ", value: cert.date },
                ].filter((item) => item.value).map((item) => (
                  <div key={item.label} style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: primaryColor }}>{item.label}:</span>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#333" }}>{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Certificate Text - fills remaining space */}
              {cert.certificate_text && (
                <div
                  style={{
                    width: "100%",
                    flex: isLandscape ? 1 : undefined,
                    overflow: isLandscape ? "hidden" : undefined,
                    marginBottom: isLandscape ? "4px" : "8px",
                  }}
                >
                  <p style={{
                    fontSize: isLandscape ? "12.5px" : "13px",
                    lineHeight: isLandscape ? 1.85 : 2,
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
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", width: "100%", marginTop: "auto", paddingTop: isLandscape ? "2px" : "6px" }}>
                {/* Stamp + Signature */}
                <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
                  {reciterSignatureUrl && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <img src={reciterSignatureUrl} alt="توقيع" style={{ height: "30px", width: "auto", objectFit: "contain", opacity: 0.8 }} />
                      <p style={{ fontSize: "7px", marginTop: "1px", color: primaryColor }}>التوقيع</p>
                    </div>
                  )}
                  {reciterStampUrl && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <img src={reciterStampUrl} alt="ختم" style={{ height: "34px", width: "34px", objectFit: "contain", opacity: 0.75 }} />
                      <p style={{ fontSize: "7px", marginTop: "1px", color: primaryColor }}>الختم</p>
                    </div>
                  )}
                  {!reciterSignatureUrl && !reciterStampUrl && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ width: "50px", height: "24px", borderBottom: `2px dashed ${primaryColor}40` }} />
                      <p style={{ fontSize: "7px", marginTop: "2px", color: `${primaryColor}80` }}>التوقيع والختم</p>
                    </div>
                  )}
                </div>

                {/* Issuer */}
                <div style={{ textAlign: "center", flex: 1, padding: "0 8px" }}>
                  <div style={{ display: "inline-block", padding: "3px 10px", borderRadius: "6px", background: `linear-gradient(135deg, rgba(13,115,119,0.06), rgba(184,134,11,0.06))` }}>
                    <p style={{ fontSize: "7px", marginBottom: "1px", color: "#999" }}>صادرة من</p>
                    <p style={{ fontSize: "10px", fontWeight: 700, color: primaryDark, margin: 0 }}>منصة مجاز لإقراء القرآن الكريم</p>
                  </div>
                  <p style={{ fontSize: "6px", marginTop: "2px", letterSpacing: "0.15em", color: "#bbb" }}>رقم الشهادة: {cert.id.slice(0, 8).toUpperCase()}</p>
                </div>

                {/* QR Code */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                  <div style={{ padding: "3px", borderRadius: "6px", background: "white", border: `1.5px solid ${primaryColor}25`, boxShadow: `0 3px 8px ${primaryColor}10` }}>
                    <QRCodeSVG value={verificationUrl} size={isLandscape ? 44 : 50} level="M" fgColor={primaryDark} bgColor="transparent" />
                  </div>
                  <p style={{ fontSize: "6px", color: primaryColor }}>للتحقق من صحة الشهادة</p>
                </div>
              </div>
            </div>

            {/* Bottom accent bar */}
            <div className="absolute bottom-0 left-0 right-0" style={{ height: "3px", background: `linear-gradient(90deg, ${primaryColor}, ${goldColor}, ${primaryColor})` }} />
          </div>
        </div>
      </div>
    );
  }
);

CertificateViewer.displayName = "CertificateViewer";

export default CertificateViewer;
