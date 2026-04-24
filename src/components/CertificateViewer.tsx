import { QRCodeSVG } from "qrcode.react";
import { forwardRef, useLayoutEffect, useRef, useState } from "react";
import logoMojaz from "@/assets/logo-mojaz-full.png";

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

    // === Mojaz brand palette (matches admin header) ===
    const ink = "#1a1d2e";
    const inkSoft = "#3a3f55";
    const muted = "#7a7f95";
    const cream = "#fbf8f1";
    const creamDeep = "#f3ecdc";
    const teal = "#0d9488";          // brand turquoise primary
    const tealDeep = "#0a6b66";      // deeper turquoise (gradient end)
    const tealDark = "#064e48";
    const gold = "#c9a14a";          // brand gold accent
    const goldDeep = "#9a7a30";
    const goldLight = "#e8d09a";

    // L = landscape PDF mode
    const L = !!renderHeight;
    const W = renderWidth;
    const H = renderHeight || 0;

    // Header band height — أصغر في وضع الـ PDF لإفساح مساحة لنص الإجازة
    const headerH = L ? 140 : 130;

    // ===== Auto-fit certificate text to fill its card without overflow =====
    const textBoxRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLParagraphElement>(null);
    const [autoFontSize, setAutoFontSize] = useState<number>(L ? 16 : 13);

    useLayoutEffect(() => {
      if (!cert.certificate_text) return;
      const box = textBoxRef.current;
      const el = textRef.current;
      if (!box || !el) return;

      // Binary-search the largest font-size where text fits inside its container
      const minSize = L ? 9 : 7;
      const maxSize = L ? 22 : 16;

      let lo = minSize;
      let hi = maxSize;
      let best = lo;

      const fits = (size: number) => {
        el.style.fontSize = `${size}px`;
        // Allow layout to settle for this size
        return el.scrollHeight <= box.clientHeight && el.scrollWidth <= box.clientWidth;
      };

      // 12 iterations is more than enough for ~0.003px precision
      for (let i = 0; i < 14; i++) {
        const mid = (lo + hi) / 2;
        if (fits(mid)) {
          best = mid;
          lo = mid;
        } else {
          hi = mid;
        }
        if (hi - lo < 0.25) break;
      }

      el.style.fontSize = `${best}px`;
      setAutoFontSize(best);
    }, [cert.certificate_text, L, W, H]);

    return (
      <div className="w-full overflow-x-auto" dir="rtl">
        <div className="w-full flex justify-center">
          <div
            ref={ref}
            className="relative overflow-hidden"
            style={{
              width: `${W}px`,
              height: H ? `${H}px` : "auto",
              background: cream,
              borderRadius: L ? "0" : "20px",
              boxShadow: L ? "none" : "0 30px 80px -20px rgba(13,148,136,0.25), 0 12px 32px -12px rgba(0,0,0,0.12)",
              fontFamily: "'Cairo', sans-serif",
            }}
          >
            {/* ================= TURQUOISE HEADER BAND ================= */}
            <div
              style={{
                position: "relative",
                height: `${headerH}px`,
                background: `linear-gradient(135deg, ${teal} 0%, ${tealDeep} 60%, ${tealDark} 100%)`,
                overflow: "hidden",
                borderTopLeftRadius: L ? "0" : "20px",
                borderTopRightRadius: L ? "0" : "20px",
              }}
            >
              {/* Decorative circles */}
              <div
                style={{
                  position: "absolute",
                  top: L ? "-90px" : "-60px",
                  left: L ? "-90px" : "-60px",
                  width: L ? "260px" : "180px",
                  height: L ? "260px" : "180px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.06)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: L ? "-70px" : "-50px",
                  right: L ? "-70px" : "-50px",
                  width: L ? "200px" : "140px",
                  height: L ? "200px" : "140px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.05)",
                }}
              />

              {/* Subtle pattern overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: `repeating-linear-gradient(45deg, transparent 0, transparent 14px, rgba(255,255,255,0.025) 14px, rgba(255,255,255,0.025) 15px)`,
                  pointerEvents: "none",
                }}
              />

              {/* Header content */}
              <div
                style={{
                  position: "relative",
                  zIndex: 2,
                  height: "100%",
                  padding: L ? "0 60px" : "0 28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: L ? "20px" : "14px",
                }}
              >
                {/* Gold icon badge */}
                <div
                  style={{
                    width: L ? "56px" : "50px",
                    height: L ? "56px" : "50px",
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${goldLight}, ${gold})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 8px 20px rgba(0,0,0,0.18), 0 0 0 4px rgba(255,255,255,0.12)`,
                    flexShrink: 0,
                  }}
                >
                  <svg width={L ? 30 : 26} height={L ? 30 : 26} viewBox="0 0 24 24" fill="none">
                    {isIjaza ? (
                      <>
                        <path d="M12 2 L2 7 L12 12 L22 7 Z" fill="#fff" />
                        <path d="M2 7 V14 L12 19 L22 14 V7" stroke="#fff" strokeWidth="1.5" fill="none" />
                        <path d="M6 9 V16 Q12 19 18 16 V9" stroke="#fff" strokeWidth="1.2" fill="none" opacity="0.7" />
                      </>
                    ) : (
                      <>
                        <circle cx="12" cy="9" r="6" stroke="#fff" strokeWidth="1.6" fill="none" />
                        <path d="M9 14 L8 22 L12 19 L16 22 L15 14" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinejoin="round" />
                        <circle cx="12" cy="9" r="2.5" fill="#fff" />
                      </>
                    )}
                  </svg>
                </div>

                {/* Title block (right-aligned, RTL) */}
                <div style={{ textAlign: "right", flex: 1, minWidth: 0 }}>
                  <h1
                    style={{
                      fontSize: L ? "44px" : "34px",
                      fontWeight: 900,
                      color: "#fff",
                      margin: 0,
                      lineHeight: 1.1,
                      letterSpacing: "-0.5px",
                      textShadow: "0 2px 8px rgba(0,0,0,0.18)",
                    }}
                  >
                    {isIjaza ? "الإجازة القرآنية" : "شهادة الختم"}
                  </h1>
                  <p
                    style={{
                      fontSize: L ? "17px" : "14px",
                      color: "rgba(255,255,255,0.92)",
                      margin: L ? "10px 0 0" : "6px 0 0",
                      lineHeight: 1.5,
                      fontWeight: 600,
                    }}
                  >
                    {isIjaza
                      ? "إجازة قرآنية معتمدة بسند متصل بإذن الإقراء"
                      : "شهادة ختم القرآن الكريم للطلاب المستحقين"}
                  </p>
                </div>

                {/* Mojaz logo on white card */}
                <div
                  style={{
                    flexShrink: 0,
                    background: "#ffffff",
                    padding: L ? "10px 14px" : "8px 10px",
                    borderRadius: L ? "12px" : "10px",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.22)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={logoMojaz}
                    alt="مجاز"
                    style={{
                      height: L ? "120px" : "100px",
                      width: "auto",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                </div>
              </div>

              {/* Bottom curved accent (gold thin line) */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "3px",
                  background: `linear-gradient(90deg, transparent, ${gold} 30%, ${goldLight} 50%, ${gold} 70%, transparent)`,
                }}
              />
            </div>

            {/* ================= BODY (light, modern, card-based) ================= */}
            <div
              style={{
                position: "relative",
                padding: L ? "16px 32px 16px" : "18px 18px 16px",
                height: H ? `${H - headerH}px` : "auto",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                background: "#f6f8fa",
                gap: L ? "10px" : "12px",
              }}
            >
              {/* Soft ambient background tints */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: `radial-gradient(ellipse at top right, ${gold}10, transparent 55%), radial-gradient(ellipse at bottom left, ${teal}08, transparent 55%)`,
                  pointerEvents: "none",
                }}
              />

              {/* Corner ornaments (subtle) */}
              {[
                { pos: { top: L ? 14 : 10, right: L ? 14 : 10 }, transform: "" },
                { pos: { top: L ? 14 : 10, left: L ? 14 : 10 }, transform: "scaleX(-1)" },
                { pos: { bottom: L ? 14 : 10, right: L ? 14 : 10 }, transform: "scaleY(-1)" },
                { pos: { bottom: L ? 14 : 10, left: L ? 14 : 10 }, transform: "scale(-1)" },
              ].map((c, i) => (
                <div key={i} style={{ position: "absolute", ...c.pos, transform: c.transform, pointerEvents: "none", opacity: 0.55 }}>
                  <svg width={L ? 38 : 24} height={L ? 38 : 24} viewBox="0 0 50 50" fill="none">
                    <path d="M0 0 L18 0" stroke={gold} strokeWidth="1.2" />
                    <path d="M0 0 L0 18" stroke={gold} strokeWidth="1.2" />
                    <circle cx="5" cy="5" r="1.8" fill={gold} />
                    <path d="M5 5 Q12 5 12 12" stroke={goldDeep} strokeWidth="0.8" fill="none" opacity="0.7" />
                  </svg>
                </div>
              ))}

              {/* ===== Combined Title + Details card (white) ===== */}
              {(() => {
                const items = [
                  { label: "الطالب/ة", value: cert.student_name, icon: "user" },
                  { label: "المقرئ/ة", value: cert.reciter_name || cert.sheikh_name, icon: "teacher" },
                  { label: "الرواية", value: cert.riwaya, icon: "book" },
                  { label: "التاريخ", value: cert.date, icon: "calendar" },
                ].filter((i) => i.value);

                return (
                  <div
                    style={{
                      position: "relative",
                      zIndex: 2,
                      background: "#ffffff",
                      borderRadius: L ? "18px" : "14px",
                      padding: L ? "12px 22px 10px" : "12px 14px 10px",
                      boxShadow: `0 1px 2px rgba(13,75,72,0.04), 0 8px 20px -8px rgba(13,148,136,0.08)`,
                      border: `1px solid #eef0f3`,
                    }}
                  >
                    {/* Top gold thin accent */}
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: L ? "60px" : "40px",
                        height: "3px",
                        background: `linear-gradient(90deg, ${gold}, ${goldLight}, ${gold})`,
                        borderRadius: "0 0 4px 4px",
                      }}
                    />

                    {/* Title block */}
                    <div style={{ textAlign: "center", marginBottom: L ? "10px" : "8px" }}>
                      <p
                        style={{
                          fontSize: L ? "12px" : "9px",
                          color: gold,
                          letterSpacing: L ? "6px" : "4px",
                          margin: "0 0 5px 0",
                          fontWeight: 700,
                        }}
                      >
                        {isIjaza ? "إجــازة قــرآنيــة" : "شهــادة تقديــر"}
                      </p>
                      <h2
                        style={{
                          fontSize: L ? "32px" : "22px",
                          fontWeight: 800,
                          color: tealDark,
                          margin: 0,
                          lineHeight: 1.2,
                          fontFamily: "'Amiri', 'Cairo', serif",
                          letterSpacing: "-0.3px",
                        }}
                      >
                        {cert.title}
                      </h2>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: L ? "4px" : "4px" }}>
                        <div style={{ width: L ? "42px" : "28px", height: "1px", background: `linear-gradient(90deg, transparent, ${gold})` }} />
                        <svg width={L ? 9 : 8} height={L ? 9 : 8} viewBox="0 0 18 18" fill="none">
                          <path d="M9 0 L11 7 L18 9 L11 11 L9 18 L7 11 L0 9 L7 7 Z" fill={gold} />
                        </svg>
                        <div style={{ width: L ? "42px" : "28px", height: "1px", background: `linear-gradient(90deg, ${gold}, transparent)` }} />
                      </div>
                    </div>

                    {/* Divider */}
                    <div style={{ height: "1px", background: `linear-gradient(90deg, transparent, ${gold}25, transparent)`, marginBottom: L ? "8px" : "8px" }} />

                    {/* Details grid */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${items.length}, 1fr)`,
                        gap: L ? "10px" : "6px",
                      }}
                    >
                    {items.map((item, idx) => (
                      <div
                        key={item.label}
                        style={{
                          textAlign: "center",
                          padding: L ? "2px 8px" : "4px 4px",
                          borderRight: idx < items.length - 1 ? `1px dashed ${gold}30` : "none",
                        }}
                      >
                        <p
                          style={{
                            fontSize: L ? "12px" : "9px",
                            color: muted,
                            margin: "0 0 5px 0",
                            letterSpacing: "1.4px",
                            fontWeight: 700,
                          }}
                        >
                          {item.label}
                        </p>
                        <p
                          style={{
                            fontSize: L ? "18px" : "13px",
                            fontWeight: 800,
                            color: tealDark,
                            margin: 0,
                            lineHeight: 1.25,
                          }}
                        >
                          {item.value}
                        </p>
                      </div>
                    ))}
                    </div>
                  </div>
                );
              })()}

              {/* ===== Body text card (white) ===== */}
              {cert.certificate_text && (
                <div
                  ref={textBoxRef}
                  style={{
                    position: "relative",
                    zIndex: 2,
                    flex: L ? 1 : undefined,
                    background: "#ffffff",
                    borderRadius: L ? "18px" : "14px",
                    padding: L ? "16px 26px 18px" : "14px 16px 16px",
                    boxShadow: `0 1px 2px rgba(13,75,72,0.04), 0 8px 20px -8px rgba(13,148,136,0.08)`,
                    border: `1px solid #eef0f3`,
                    display: "flex",
                    alignItems: "center",
                    overflow: "hidden",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: L ? "4px" : "4px",
                      right: L ? "12px" : "10px",
                      fontSize: L ? "40px" : "34px",
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
                      bottom: L ? "-4px" : "-4px",
                      left: L ? "12px" : "10px",
                      fontSize: L ? "40px" : "34px",
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
                    ref={textRef}
                    style={{
                      fontSize: `${autoFontSize}px`,
                      lineHeight: L ? 1.75 : 1.85,
                      textAlign: "justify",
                      fontWeight: 400,
                      color: inkSoft,
                      fontFamily: "'Amiri', 'Cairo', serif",
                      margin: 0,
                      width: "100%",
                      letterSpacing: "0.1px",
                    }}
                  >
                    {cert.certificate_text}
                  </p>
                </div>
              )}

              {/* ===== Footer (3 white cards) ===== */}
              <div
                style={{
                  position: "relative",
                  zIndex: 2,
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  gap: L ? "10px" : "8px",
                  alignItems: "stretch",
                }}
              >
                {/* QR card */}
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: L ? "16px" : "12px",
                    padding: L ? "8px 12px 6px" : "8px 8px 6px",
                    boxShadow: `0 1px 2px rgba(13,75,72,0.04), 0 8px 20px -8px rgba(13,148,136,0.08)`,
                    border: `1px solid #eef0f3`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: L ? "4px" : "4px",
                  }}
                >
                  <QRCodeSVG value={verificationUrl} size={L ? 60 : 50} level="M" fgColor={tealDark} bgColor="transparent" />
                  <p style={{ fontSize: L ? "8px" : "6px", color: muted, margin: 0, letterSpacing: "1px", fontWeight: 700 }}>
                    للتحقق
                  </p>
                </div>

                {/* Issuer seal card */}
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: L ? "16px" : "12px",
                    padding: L ? "8px 16px" : "8px 10px",
                    boxShadow: `0 1px 2px rgba(13,75,72,0.04), 0 8px 20px -8px rgba(13,148,136,0.08)`,
                    border: `1px solid #eef0f3`,
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    position: "relative",
                  }}
                >
                  {/* Top gold accent */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: L ? "50px" : "32px",
                      height: "2.5px",
                      background: `linear-gradient(90deg, ${teal}, ${gold})`,
                      borderRadius: "0 0 4px 4px",
                    }}
                  />
                  <p
                    style={{
                      fontSize: L ? "8px" : "6.5px",
                      margin: "2px 0 3px",
                      color: muted,
                      letterSpacing: "2px",
                      fontWeight: 700,
                    }}
                  >
                    صــــادرة من
                  </p>
                  <p
                    style={{
                      fontSize: L ? "13px" : "11px",
                      fontWeight: 800,
                      color: tealDark,
                      margin: 0,
                      letterSpacing: "0.3px",
                      lineHeight: 1.2,
                    }}
                  >
                    منصة مجاز لإقراء القرآن الكريم
                  </p>
                  <p
                    style={{
                      fontSize: L ? "7px" : "6px",
                      marginTop: L ? "3px" : "4px",
                      letterSpacing: "3px",
                      color: muted,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                    }}
                  >
                    رقم · {cert.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>

                {/* Signature & stamp card */}
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: L ? "16px" : "12px",
                    padding: L ? "8px 14px 6px" : "8px 10px 6px",
                    boxShadow: `0 1px 2px rgba(13,75,72,0.04), 0 8px 20px -8px rgba(13,148,136,0.08)`,
                    border: `1px solid #eef0f3`,
                    display: "flex",
                    alignItems: "flex-end",
                    gap: L ? "12px" : "8px",
                  }}
                >
                  {reciterStampUrl && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <img
                        src={reciterStampUrl}
                        alt="ختم"
                        style={{
                          height: L ? "48px" : "38px",
                          width: L ? "48px" : "38px",
                          objectFit: "contain",
                          opacity: 0.9,
                        }}
                      />
                      <div style={{ width: L ? "54px" : "34px", height: "1px", background: gold, marginTop: "4px" }} />
                      <p style={{ fontSize: L ? "8px" : "6.5px", marginTop: "2px", color: muted, letterSpacing: "1.5px", fontWeight: 700 }}>
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
                          height: L ? "44px" : "32px",
                          width: "auto",
                          maxWidth: L ? "110px" : "76px",
                          objectFit: "contain",
                          opacity: 0.92,
                        }}
                      />
                      <div style={{ width: L ? "72px" : "48px", height: "1px", background: gold, marginTop: "4px" }} />
                      <p style={{ fontSize: L ? "8px" : "6.5px", marginTop: "2px", color: muted, letterSpacing: "1.5px", fontWeight: 700 }}>
                        الـتـوقـيـع
                      </p>
                    </div>
                  )}
                  {!reciterSignatureUrl && !reciterStampUrl && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ width: L ? "80px" : "60px", height: L ? "36px" : "28px" }} />
                      <div style={{ width: L ? "100px" : "60px", height: "1px", background: gold, marginTop: "4px" }} />
                      <p style={{ fontSize: L ? "8px" : "6.5px", marginTop: "2px", color: muted, letterSpacing: "1.5px", fontWeight: 700 }}>
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
