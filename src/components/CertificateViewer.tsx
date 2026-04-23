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
  renderHeight?: number;
}

const CertificateViewer = forwardRef<HTMLDivElement, CertificateViewerProps>(
  ({ cert, reciterSignatureUrl, reciterStampUrl, renderWidth = 920, renderHeight }, ref) => {
    const isIjaza = cert.type === "ijaza";
    const verificationUrl = `${window.location.origin}/verify/${cert.id}`;

    // Refined luxury palette
    const ink = "#1a1d2e";          // near-black for body
    const inkSoft = "#3a3f55";      // soft body
    const muted = "#8b8fa3";        // labels / meta
    const cream = "#fbf8f1";        // warm paper
    const creamDeep = "#f3ecdc";    // border bg
    const teal = "#0d7377";         // brand teal
    const tealDeep = "#0a5c5f";
    const gold = "#b89556";         // refined antique gold
    const goldDeep = "#8a6d36";
    const goldLight = "#d4b87a";

    const accent = isIjaza ? gold : teal;
    const accentDeep = isIjaza ? goldDeep : tealDeep;

    // L = landscape PDF mode
    const L = !!renderHeight;
    const W = renderWidth;
    const H = renderHeight || 0;
    // Outer frame insets
    const pad = L ? 28 : 16;

    return (
      <div className="w-full overflow-x-auto" dir="rtl">
        <div className="w-full flex justify-center">
          <div
            ref={ref}
            className="relative overflow-hidden"
            style={{
              width: `${W}px`,
              height: H ? `${H}px` : "auto",
              background: `
                radial-gradient(ellipse at top right, ${gold}08, transparent 50%),
                radial-gradient(ellipse at bottom left, ${teal}08, transparent 50%),
                linear-gradient(135deg, ${cream}, #fdfbf5 50%, ${cream})
              `,
              boxShadow: L ? "none" : "0 30px 80px -20px rgba(13,115,119,0.18), 0 12px 32px -12px rgba(0,0,0,0.12)",
              fontFamily: "'Cairo', sans-serif",
            }}
          >
            {/* === Subtle paper texture === */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 20% 30%, ${gold}06 0%, transparent 8%),
                  radial-gradient(circle at 80% 70%, ${teal}06 0%, transparent 8%),
                  repeating-linear-gradient(45deg, transparent 0, transparent 2px, ${ink}03 2px, ${ink}03 3px)
                `,
                opacity: 0.6,
              }}
            />

            {/* === Outer luxe double border === */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: pad,
                left: pad,
                right: pad,
                bottom: pad,
                border: `1px solid ${gold}80`,
                borderRadius: "2px",
              }}
            />
            <div
              className="absolute pointer-events-none"
              style={{
                top: pad + 6,
                left: pad + 6,
                right: pad + 6,
                bottom: pad + 6,
                border: `1px solid ${gold}40`,
                borderRadius: "1px",
              }}
            />

            {/* === Corner ornaments (refined arabesque) === */}
            {[
              { pos: { top: pad - 4, right: pad - 4 }, transform: "" },
              { pos: { top: pad - 4, left: pad - 4 }, transform: "scaleX(-1)" },
              { pos: { bottom: pad - 4, right: pad - 4 }, transform: "scaleY(-1)" },
              { pos: { bottom: pad - 4, left: pad - 4 }, transform: "scale(-1)" },
            ].map((c, i) => (
              <div key={i} className="absolute pointer-events-none" style={{ ...c.pos, transform: c.transform }}>
                <svg width={L ? 70 : 42} height={L ? 70 : 42} viewBox="0 0 70 70" fill="none">
                  {/* Arabesque flourish */}
                  <path d="M0 0 L22 0 Q12 2 8 8 Q2 12 0 22 Z" fill={gold} opacity="0.18" />
                  <path d="M0 0 L35 0" stroke={gold} strokeWidth="1" opacity="0.7" />
                  <path d="M0 0 L0 35" stroke={gold} strokeWidth="1" opacity="0.7" />
                  <path d="M6 6 Q14 6 14 14 Q14 22 22 22" stroke={goldDeep} strokeWidth="0.8" fill="none" opacity="0.6" />
                  <path d="M10 10 Q16 10 16 16 Q16 22 22 22 M10 10 Q10 16 16 16" stroke={gold} strokeWidth="0.6" fill="none" opacity="0.5" />
                  <circle cx="6" cy="6" r="2" fill={goldDeep} opacity="0.7" />
                  <circle cx="14" cy="14" r="1.5" fill={gold} opacity="0.6" />
                  <circle cx="22" cy="22" r="1" fill={goldDeep} opacity="0.5" />
                </svg>
              </div>
            ))}

            {/* === Top center ornamental crest === */}
            <div
              className="absolute"
              style={{ top: pad - (L ? 14 : 8), left: "50%", transform: "translateX(-50%)" }}
            >
              <svg width={L ? 180 : 110} height={L ? 28 : 18} viewBox="0 0 180 28" fill="none">
                <path d="M0 14 L70 14" stroke={gold} strokeWidth="0.8" />
                <path d="M110 14 L180 14" stroke={gold} strokeWidth="0.8" />
                <path d="M75 14 Q90 4 105 14 Q90 24 75 14 Z" fill={cream} stroke={gold} strokeWidth="1" />
                <circle cx="90" cy="14" r="3" fill={gold} />
                <circle cx="90" cy="14" r="1" fill={cream} />
                <circle cx="70" cy="14" r="1.5" fill={gold} />
                <circle cx="110" cy="14" r="1.5" fill={gold} />
              </svg>
            </div>

            {/* === Content === */}
            <div
              className="relative z-10 flex flex-col"
              style={{
                padding: L ? `${pad + 28}px ${pad + 32}px ${pad + 20}px` : `${pad + 12}px ${pad + 14}px`,
                height: H ? `${H}px` : "auto",
                boxSizing: "border-box",
              }}
            >
              {/* === Header: Brand === */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: L ? "14px" : "10px", marginBottom: L ? "14px" : "10px" }}>
                <img
                  src={logoMojaz}
                  alt="مجاز"
                  style={{
                    height: L ? "56px" : "40px",
                    width: L ? "56px" : "40px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: `2px solid ${gold}`,
                    boxShadow: `0 0 0 3px ${cream}, 0 4px 12px ${teal}25`,
                  }}
                />
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: L ? "20px" : "14px", fontWeight: 800, color: tealDeep, margin: 0, lineHeight: 1.1, letterSpacing: "0.5px" }}>
                    منصة مجاز
                  </p>
                  <p style={{ fontSize: L ? "11px" : "8px", color: gold, margin: "2px 0 0", lineHeight: 1, letterSpacing: "2px", textTransform: "uppercase" }}>
                    لإقراء القرآن الكريم
                  </p>
                </div>
              </div>

              {/* === Title section === */}
              <div style={{ textAlign: "center", marginBottom: L ? "16px" : "12px" }}>
                <p
                  style={{
                    fontSize: L ? "11px" : "8px",
                    color: muted,
                    letterSpacing: L ? "8px" : "5px",
                    margin: "0 0 6px 0",
                    fontWeight: 500,
                  }}
                >
                  {isIjaza ? "إجــازة قــرآنيــة" : "شهــادة تقديــر"}
                </p>
                <h1
                  style={{
                    fontSize: L ? "42px" : "26px",
                    fontWeight: 700,
                    color: ink,
                    margin: 0,
                    lineHeight: 1.2,
                    fontFamily: "'Amiri', 'Cairo', serif",
                    letterSpacing: "-0.5px",
                  }}
                >
                  {cert.title}
                </h1>
                {/* Decorative underline */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: L ? "10px" : "6px" }}>
                  <div style={{ width: L ? "70px" : "40px", height: "1px", background: `linear-gradient(90deg, transparent, ${gold})` }} />
                  <svg width={L ? 16 : 10} height={L ? 16 : 10} viewBox="0 0 16 16" fill="none">
                    <path d="M8 0 L9.5 6.5 L16 8 L9.5 9.5 L8 16 L6.5 9.5 L0 8 L6.5 6.5 Z" fill={gold} />
                  </svg>
                  <div style={{ width: L ? "70px" : "40px", height: "1px", background: `linear-gradient(90deg, ${gold}, transparent)` }} />
                </div>
              </div>

              {/* === Details row (luxe pills) === */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: L ? "32px" : "14px",
                  marginBottom: L ? "18px" : "10px",
                  flexWrap: "wrap",
                  paddingBottom: L ? "16px" : "8px",
                  borderBottom: `1px dashed ${gold}40`,
                }}
              >
                {[
                  { label: "الطالب/ة", value: cert.student_name },
                  { label: "المقرئ/ة", value: cert.reciter_name || cert.sheikh_name },
                  { label: "الرواية", value: cert.riwaya },
                  { label: "التاريخ", value: cert.date },
                ]
                  .filter((item) => item.value)
                  .map((item, idx, arr) => (
                    <div key={item.label} style={{ display: "flex", alignItems: "center", gap: L ? "20px" : "10px" }}>
                      <div style={{ textAlign: "center" }}>
                        <p
                          style={{
                            fontSize: L ? "10px" : "7px",
                            color: muted,
                            margin: "0 0 4px 0",
                            letterSpacing: "1.5px",
                            fontWeight: 600,
                            textTransform: "uppercase",
                          }}
                        >
                          {item.label}
                        </p>
                        <p style={{ fontSize: L ? "16px" : "11px", fontWeight: 700, color: ink, margin: 0, lineHeight: 1.2 }}>
                          {item.value}
                        </p>
                      </div>
                      {idx < arr.length - 1 && (
                        <div style={{ width: "1px", height: L ? "28px" : "20px", background: `${gold}50` }} />
                      )}
                    </div>
                  ))}
              </div>

              {/* === Certificate body text === */}
              {cert.certificate_text && (
                <div
                  style={{
                    flex: L ? 1 : undefined,
                    overflow: L ? "hidden" : undefined,
                    display: "flex",
                    alignItems: "center",
                    position: "relative",
                    padding: L ? "8px 24px" : "6px 12px",
                  }}
                >
                  {/* Decorative quote marks */}
                  <span
                    style={{
                      position: "absolute",
                      top: L ? "-8px" : "-4px",
                      right: L ? "8px" : "4px",
                      fontSize: L ? "60px" : "36px",
                      lineHeight: 1,
                      color: `${gold}30`,
                      fontFamily: "'Amiri', serif",
                      fontWeight: 700,
                      pointerEvents: "none",
                    }}
                  >
                    ❝
                  </span>
                  <span
                    style={{
                      position: "absolute",
                      bottom: L ? "-20px" : "-12px",
                      left: L ? "8px" : "4px",
                      fontSize: L ? "60px" : "36px",
                      lineHeight: 1,
                      color: `${gold}30`,
                      fontFamily: "'Amiri', serif",
                      fontWeight: 700,
                      pointerEvents: "none",
                    }}
                  >
                    ❞
                  </span>

                  <p
                    style={{
                      fontSize: L ? "16.5px" : "12px",
                      lineHeight: L ? 2.1 : 1.95,
                      textAlign: "justify",
                      fontWeight: 400,
                      color: inkSoft,
                      fontFamily: "'Amiri', 'Cairo', serif",
                      margin: 0,
                      width: "100%",
                      letterSpacing: "0.2px",
                    }}
                  >
                    {cert.certificate_text}
                  </p>
                </div>
              )}

              {/* === Footer === */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  width: "100%",
                  marginTop: "auto",
                  paddingTop: L ? "16px" : "10px",
                  borderTop: `1px solid ${gold}30`,
                  gap: L ? "20px" : "10px",
                }}
              >
                {/* === QR (left) === */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                  <div
                    style={{
                      padding: L ? "8px" : "4px",
                      borderRadius: L ? "6px" : "4px",
                      background: cream,
                      border: `1px solid ${gold}50`,
                      boxShadow: `0 4px 12px ${ink}10`,
                    }}
                  >
                    <QRCodeSVG value={verificationUrl} size={L ? 78 : 48} level="M" fgColor={ink} bgColor="transparent" />
                  </div>
                  <p style={{ fontSize: L ? "8px" : "6px", color: muted, margin: 0, letterSpacing: "1px", fontWeight: 600 }}>
                    للتحقق من الشهادة
                  </p>
                </div>

                {/* === Issuer seal (center) === */}
                <div style={{ textAlign: "center", flex: 1, padding: "0 8px" }}>
                  <div
                    style={{
                      display: "inline-flex",
                      flexDirection: "column",
                      alignItems: "center",
                      padding: L ? "10px 28px" : "6px 14px",
                      borderRadius: "2px",
                      background: `linear-gradient(180deg, ${cream}, ${creamDeep})`,
                      border: `1px solid ${gold}50`,
                      borderTop: `2px solid ${gold}`,
                      borderBottom: `2px solid ${gold}`,
                    }}
                  >
                    <p style={{ fontSize: L ? "9px" : "6.5px", margin: 0, color: muted, letterSpacing: "2px", fontWeight: 600 }}>
                      صــــادرة من
                    </p>
                    <p
                      style={{
                        fontSize: L ? "14px" : "10px",
                        fontWeight: 800,
                        color: tealDeep,
                        margin: "3px 0 0",
                        letterSpacing: "0.3px",
                      }}
                    >
                      منصة مجاز لإقراء القرآن الكريم
                    </p>
                  </div>
                  <p
                    style={{
                      fontSize: L ? "8px" : "6px",
                      marginTop: "8px",
                      letterSpacing: "3px",
                      color: muted,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 600,
                    }}
                  >
                    رقم الشهادة · {cert.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>

                {/* === Signature & Stamp (right) === */}
                <div style={{ display: "flex", alignItems: "flex-end", gap: L ? "18px" : "10px", flexShrink: 0 }}>
                  {reciterStampUrl && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <img
                        src={reciterStampUrl}
                        alt="ختم"
                        style={{
                          height: L ? "70px" : "40px",
                          width: L ? "70px" : "40px",
                          objectFit: "contain",
                          opacity: 0.85,
                        }}
                      />
                      <div style={{ width: L ? "60px" : "36px", height: "1px", background: gold, marginTop: "4px" }} />
                      <p style={{ fontSize: L ? "9px" : "6.5px", marginTop: "4px", color: muted, letterSpacing: "1.5px", fontWeight: 600 }}>
                        الـخـتـم
                      </p>
                    </div>
                  )}
                  {reciterSignatureUrl && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <img
                        src={reciterSignatureUrl}
                        alt="توقيع"
                        style={{
                          height: L ? "60px" : "34px",
                          width: "auto",
                          maxWidth: L ? "140px" : "80px",
                          objectFit: "contain",
                          opacity: 0.9,
                        }}
                      />
                      <div style={{ width: L ? "80px" : "50px", height: "1px", background: gold, marginTop: "4px" }} />
                      <p style={{ fontSize: L ? "9px" : "6.5px", marginTop: "4px", color: muted, letterSpacing: "1.5px", fontWeight: 600 }}>
                        الـتـوقـيـع
                      </p>
                    </div>
                  )}
                  {!reciterSignatureUrl && !reciterStampUrl && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ width: L ? "100px" : "60px", height: L ? "50px" : "30px" }} />
                      <div style={{ width: L ? "100px" : "60px", height: "1px", background: gold, marginTop: "4px" }} />
                      <p style={{ fontSize: L ? "9px" : "6.5px", marginTop: "4px", color: muted, letterSpacing: "1.5px", fontWeight: 600 }}>
                        التوقيع والختم
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CertificateViewer.displayName = "CertificateViewer";

export default CertificateViewer;
