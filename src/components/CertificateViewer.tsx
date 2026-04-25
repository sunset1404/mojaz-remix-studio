import { QRCodeSVG } from "qrcode.react";
import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

const resolveStorageImageUrl = (value?: string | null) => {
  if (!value) return null;
  if (/^(https?:|data:|blob:|\/)/i.test(value)) return value;

  const normalized = value
    .replace(/^\/storage\/v1\/object\/public\/reciter-assets\//, "")
    .replace(/^reciter-assets\//, "")
    .replace(/^\//, "");

  const { data } = supabase.storage.from("reciter-assets").getPublicUrl(normalized);
  return data.publicUrl;
};

const fetchImageAsDataUrl = async (url: string) => {
  const targetUrl = url.startsWith("/") ? new URL(url, window.location.origin).toString() : url;
  const response = await fetch(targetUrl, { mode: "cors", cache: "force-cache" });
  if (!response.ok) throw new Error(`Failed to load image: ${response.status}`);

  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Failed to convert image to data URL"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read image blob"));
    reader.readAsDataURL(blob);
  });
};

const useRenderableImageSrc = (value?: string | null) => {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const resolved = resolveStorageImageUrl(value);

    if (!resolved) {
      setSrc(null);
      return;
    }

    if (/^(data:|blob:)/i.test(resolved)) {
      setSrc(resolved);
      return;
    }

    setSrc(resolved);

    (async () => {
      try {
        const dataUrl = await fetchImageAsDataUrl(resolved);
        if (!cancelled) setSrc(dataUrl);
      } catch {
        if (!cancelled) setSrc(resolved);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [value]);

  return src;
};

const HEADER_LOGO_SRC = "/eqraa-header-logo-transparent-v5.png?v=5";

const CertificateViewer = forwardRef<HTMLDivElement, CertificateViewerProps>(
  ({ cert, reciterSignatureUrl, reciterStampUrl, renderWidth = 920, renderHeight }, ref) => {
    const isIjaza = cert.type === "ijaza";
    const verificationUrl = `${window.location.origin}/verify/${cert.id}`;
    const resolvedHeaderLogoSrc = useRenderableImageSrc(HEADER_LOGO_SRC);
    const resolvedSignatureUrl = useRenderableImageSrc(reciterSignatureUrl);
    const resolvedStampUrl = useRenderableImageSrc(reciterStampUrl);

    // === Mojaz brand palette (matches admin header) ===
    const inkSoft = "#3a3f55";
    const muted = "#7a7f95";
    const cream = "#fbf8f1";
    const teal = "#0d9488";          // brand turquoise primary
    const tealDeep = "#0a6b66";      // deeper turquoise (gradient end)
    const tealDark = "#064e48";
    const gold = "#c9a14a";          // brand gold accent
    const goldDeep = "#9a7a30";
    const goldLight = "#e8d09a";

    // L = "landscape-style" PDF mode (kept for backward-compat).
    // forcePortraitFill = portrait PDF where we just stretch the preview design to fill height.
    const L = !!renderHeight && (renderHeight < renderWidth);
    const forcePortraitFill = !!renderHeight && !L;
    const W = renderWidth;
    const H = renderHeight || 0;

    // Header band height
    const headerH = L ? 200 : 170;

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
      const minSize = (L || forcePortraitFill) ? 9 : 7;
      const maxSize = (L || forcePortraitFill) ? 36 : 24;

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
              background: `
                radial-gradient(ellipse at top, ${gold}08, transparent 60%),
                radial-gradient(ellipse at bottom, ${teal}06, transparent 55%),
                ${cream}
              `,
              borderRadius: L ? "0" : "20px",
              boxShadow: L ? "none" : "0 30px 80px -20px rgba(13,148,136,0.25), 0 12px 32px -12px rgba(0,0,0,0.12)",
              fontFamily: "'Cairo', sans-serif",
            }}
          >
            {/* ============== LUXURIOUS DOUBLE GOLD ORNAMENTAL FRAME ============== */}
            {/* Outer thin gold border */}
            <div
              style={{
                position: "absolute",
                inset: L ? "10px" : "8px",
                border: `1.5px solid ${gold}55`,
                borderRadius: L ? "12px" : "14px",
                pointerEvents: "none",
                zIndex: 5,
              }}
            />
            {/* Inner thin gold border */}
            <div
              style={{
                position: "absolute",
                inset: L ? "16px" : "13px",
                border: `0.5px solid ${gold}40`,
                borderRadius: L ? "8px" : "10px",
                pointerEvents: "none",
                zIndex: 5,
              }}
            />

            {/* ============== ORNAMENTAL CORNER FLOURISHES ============== */}
            {[
              { top: L ? 6 : 4, right: L ? 6 : 4, deg: 0 },
              { top: L ? 6 : 4, left: L ? 6 : 4, deg: 90 },
              { bottom: L ? 6 : 4, right: L ? 6 : 4, deg: -90 },
              { bottom: L ? 6 : 4, left: L ? 6 : 4, deg: 180 },
            ].map((c, i) => {
              const { deg, ...pos } = c;
              return (
                <div
                  key={`corner-${i}`}
                  style={{
                    position: "absolute",
                    ...pos,
                    pointerEvents: "none",
                    zIndex: 6,
                    transform: `rotate(${deg}deg)`,
                  }}
                >
                  <svg width={L ? 60 : 46} height={L ? 60 : 46} viewBox="0 0 60 60" fill="none">
                    <path d="M2 2 L20 2 M2 2 L2 20" stroke={gold} strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M8 8 Q22 8 22 22" stroke={goldDeep} strokeWidth="0.8" fill="none" opacity="0.7" />
                    <circle cx="2" cy="2" r="2.5" fill={gold} />
                    <circle cx="14" cy="2" r="1" fill={goldDeep} opacity="0.6" />
                    <circle cx="2" cy="14" r="1" fill={goldDeep} opacity="0.6" />
                    <path d="M22 22 L28 22 M22 22 L22 28" stroke={gold} strokeWidth="0.6" opacity="0.5" />
                  </svg>
                </div>
              );
            })}

            {/* ============== CENTRAL WATERMARK (very subtle) ============== */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
                zIndex: 1,
                opacity: 0.04,
              }}
            >
              <svg width={L ? 600 : 460} height={L ? 600 : 460} viewBox="0 0 200 200" fill="none">
                {/* Eight-pointed Islamic geometric star */}
                <g transform="translate(100,100)">
                  <path
                    d="M0,-80 L18,-30 L70,-30 L25,0 L45,55 L0,25 L-45,55 L-25,0 L-70,-30 L-18,-30 Z"
                    fill={tealDark}
                    transform="rotate(0)"
                  />
                  <path
                    d="M0,-80 L18,-30 L70,-30 L25,0 L45,55 L0,25 L-45,55 L-25,0 L-70,-30 L-18,-30 Z"
                    fill={gold}
                    transform="rotate(22.5)"
                    opacity="0.7"
                  />
                  <circle r="40" fill="none" stroke={tealDark} strokeWidth="1" />
                  <circle r="55" fill="none" stroke={gold} strokeWidth="0.6" />
                </g>
              </svg>
            </div>

            {/* ============== SIDE ARABESQUE STRIPS (gold dotted rhythm) ============== */}
            <div
              style={{
                position: "absolute",
                top: `${headerH + (L ? 30 : 22)}px`,
                bottom: L ? "30px" : "22px",
                right: L ? "22px" : "18px",
                width: "6px",
                pointerEvents: "none",
                zIndex: 1,
                backgroundImage: `repeating-linear-gradient(180deg, ${gold}55 0, ${gold}55 2px, transparent 2px, transparent 10px)`,
                opacity: 0.55,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: `${headerH + (L ? 30 : 22)}px`,
                bottom: L ? "30px" : "22px",
                left: L ? "22px" : "18px",
                width: "6px",
                pointerEvents: "none",
                zIndex: 1,
                backgroundImage: `repeating-linear-gradient(180deg, ${gold}55 0, ${gold}55 2px, transparent 2px, transparent 10px)`,
                opacity: 0.55,
              }}
            />

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
                      fontSize: L ? "52px" : "40px",
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
                      fontSize: L ? "20px" : "17px",
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

                {/* Header logo */}
                {resolvedHeaderLogoSrc ? (
                  <img
                    src={resolvedHeaderLogoSrc}
                    alt="إقراء"
                    crossOrigin="anonymous"
                    style={{
                      flexShrink: 0,
                      height: L ? "170px" : "146px",
                      maxWidth: L ? "170px" : "146px",
                      width: "auto",
                      objectFit: "contain",
                      objectPosition: "center",
                      display: "block",
                    }}
                  />
                ) : null}
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
                padding: L ? "10px 32px 16px" : "10px 14px 14px",
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
                      display: "grid",
                      gridTemplateColumns: `1.6fr ${items.map(() => "1fr").join(" ")}`,
                      gap: L ? "12px" : "10px",
                      alignItems: "stretch",
                    }}
                  >
                    {/* Title card */}
                    <div
                      style={{
                        position: "relative",
                        background: "#ffffff",
                        borderRadius: L ? "16px" : "12px",
                        padding: L ? "14px 18px" : "12px 14px",
                        boxShadow: `0 1px 2px rgba(13,75,72,0.05), 0 10px 24px -12px rgba(13,148,136,0.18)`,
                        border: `1px solid #eef0f3`,
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          height: "3px",
                          background: `linear-gradient(90deg, ${teal}, ${gold})`,
                        }}
                      />
                      <p
                        style={{
                          fontSize: L ? "22px" : "16px",
                          color: muted,
                          margin: "0 0 8px 0",
                          letterSpacing: "1.4px",
                          fontWeight: 700,
                        }}
                      >
                        القراءة
                      </p>
                      <h2
                        style={{
                          fontSize: L ? "36px" : "26px",
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
                    </div>
                    {items.map((item) => (
                      <div
                        key={item.label}
                        style={{
                          position: "relative",
                          background: "#ffffff",
                          borderRadius: L ? "16px" : "12px",
                          padding: L ? "14px 12px" : "12px 8px",
                          boxShadow: `0 1px 2px rgba(13,75,72,0.05), 0 10px 24px -12px rgba(13,148,136,0.18)`,
                          border: `1px solid #eef0f3`,
                          textAlign: "center",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            height: "3px",
                            background: `linear-gradient(90deg, ${gold}, ${goldLight}, ${gold})`,
                          }}
                        />
                        <p
                          style={{
                            fontSize: L ? "22px" : "16px",
                            color: muted,
                            margin: "0 0 8px 0",
                            letterSpacing: "1.4px",
                            fontWeight: 700,
                          }}
                        >
                          {item.label}
                        </p>
                        <p
                          style={{
                            fontSize: L ? "26px" : "20px",
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
                );
              })()}

              {/* ===== Body text card (white) ===== */}
              {cert.certificate_text && (
                <div
                  ref={textBoxRef}
                  style={{
                    position: "relative",
                    zIndex: 2,
                    flex: (L || forcePortraitFill) ? 1 : undefined,
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
                  <QRCodeSVG value={verificationUrl} size={L ? 130 : 110} level="M" fgColor={tealDark} bgColor="transparent" />
                  <p style={{ fontSize: L ? "17px" : "15px", color: muted, margin: 0, letterSpacing: "1px", fontWeight: 700, textAlign: "center" }}>
                    للتحقق من صحة الإجازة
                  </p>
                </div>

                {/* Issuer seal card */}
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: L ? "16px" : "12px",
                    padding: L ? "14px 22px" : "12px 14px",
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
                      width: L ? "60px" : "40px",
                      height: "3px",
                      background: `linear-gradient(90deg, ${teal}, ${gold})`,
                      borderRadius: "0 0 4px 4px",
                    }}
                  />
                  <p
                    style={{
                      fontSize: L ? "18px" : "15px",
                      margin: "6px 0 8px",
                      color: muted,
                      letterSpacing: "2px",
                      fontWeight: 700,
                    }}
                  >
                    صــــادرة من
                  </p>
                  <p
                    style={{
                      fontSize: L ? "28px" : "22px",
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
                      fontSize: L ? "17px" : "14px",
                      marginTop: L ? "8px" : "7px",
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
                    padding: L ? "12px 18px 10px" : "12px 14px 10px",
                    boxShadow: `0 1px 2px rgba(13,75,72,0.04), 0 8px 20px -8px rgba(13,148,136,0.08)`,
                    border: `1px solid #eef0f3`,
                    display: "flex",
                    alignItems: "flex-end",
                    gap: L ? "16px" : "14px",
                  }}
                >
                  {resolvedStampUrl && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <img
                        src={resolvedStampUrl}
                        alt="ختم"
                        crossOrigin="anonymous"
                        style={{
                          height: L ? "115px" : "95px",
                          width: L ? "115px" : "95px",
                          objectFit: "contain",
                          opacity: 0.92,
                        }}
                      />
                      <div style={{ width: L ? "100px" : "82px", height: "1px", background: gold, marginTop: "5px" }} />
                      <p style={{ fontSize: L ? "16px" : "14px", marginTop: "4px", color: muted, letterSpacing: "1.5px", fontWeight: 700 }}>
                        ختم المقرئ/ة
                      </p>
                    </div>
                  )}
                  {resolvedSignatureUrl && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <img
                        src={resolvedSignatureUrl}
                        alt="توقيع"
                        crossOrigin="anonymous"
                        style={{
                          height: L ? "100px" : "82px",
                          width: "auto",
                          maxWidth: L ? "220px" : "180px",
                          objectFit: "contain",
                          opacity: 0.95,
                        }}
                      />
                      <div style={{ width: L ? "140px" : "110px", height: "1px", background: gold, marginTop: "5px" }} />
                      <p style={{ fontSize: L ? "16px" : "14px", marginTop: "4px", color: muted, letterSpacing: "1.5px", fontWeight: 700 }}>
                        توقيع المقرئ/ة
                      </p>
                    </div>
                  )}
                  {!resolvedSignatureUrl && !resolvedStampUrl && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ width: L ? "150px" : "120px", height: L ? "80px" : "65px" }} />
                      <div style={{ width: L ? "160px" : "120px", height: "1px", background: gold, marginTop: "5px" }} />
                      <p style={{ fontSize: L ? "16px" : "14px", marginTop: "4px", color: muted, letterSpacing: "1.5px", fontWeight: 700 }}>
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
