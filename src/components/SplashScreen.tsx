import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logoMojaz from "@/assets/logo-mojaz-new.png";

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 900);
    const t2 = setTimeout(() => onFinish(), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onFinish]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background:
          "linear-gradient(170deg, hsl(174 42% 28%) 0%, hsl(174 42% 35%) 30%, hsl(174 38% 40%) 55%, hsl(174 35% 38%) 80%, hsl(174 30% 32%) 100%)",
      }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Gold glow overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 80% 60% at 50% 85%, hsl(43 50% 50% / 0.25) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 30% 50%, hsl(43 50% 50% / 0.12) 0%, transparent 60%)",
      }} />

      {/* Decorative circles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.1 }} transition={{ duration: 1.2 }}
          className="absolute top-12 right-6 w-40 h-40 rounded-full border-2 border-primary-foreground/20" />
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.08 }} transition={{ duration: 1.2, delay: 0.2 }}
          className="absolute -top-12 -left-12 w-56 h-56 rounded-full border-2 border-primary-foreground/15" />
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.06 }} transition={{ duration: 1, delay: 0.4 }}
          className="absolute bottom-20 right-4 w-28 h-28 rounded-full bg-gold/15 blur-xl" />
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.08 }} transition={{ duration: 1, delay: 0.3 }}
          className="absolute bottom-40 -left-8 w-36 h-36 rounded-full bg-primary-foreground/10 blur-xl" />
        <div className="absolute top-16 right-24 w-3 h-3 rounded-full bg-gold/40" />
        <div className="absolute top-32 left-10 w-2 h-2 rounded-full bg-gold/50" />
        <div className="absolute bottom-32 right-16 w-2.5 h-2.5 rounded-full bg-primary-foreground/25" />
      </div>

      {/* Splash glow */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-10"
        style={{ width: 320, height: 320, borderRadius: "50%", top: "calc(38vh - 160px)", background: "radial-gradient(circle, hsl(43 50% 55% / 0.25) 0%, transparent 70%)" }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.3, scale: 1 }}
        transition={{ duration: 1.2 }}
      />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none z-10"
          style={{
            width: 4 + i * 3, height: 4 + i * 3,
            background: `hsla(43, 50%, 55%, ${0.15 + i * 0.05})`,
            top: `${15 + i * 13}%`, left: `${10 + (i % 3) * 30}%`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0.5, 1], scale: [0, 1.2, 0.8, 1], y: [0, -10, 5, 0] }}
          transition={{ duration: 2.5, delay: 0.3 + i * 0.15, repeat: Infinity, repeatType: "reverse" }}
        />
      ))}

      {/* Logo */}
      <motion.div
        className="relative z-20 flex flex-col items-center"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.1 }}
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="rounded-3xl overflow-hidden shadow-lg border-2 border-primary-foreground/30 p-1 bg-card/90 backdrop-blur-sm w-36 h-36">
            <img src={logoMojaz} alt="مجاز" className="w-full h-full object-contain rounded-2xl" />
          </div>

          {/* Shine sweep */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
            <motion.div
              className="absolute w-full h-full"
              style={{ background: "linear-gradient(105deg, transparent 40%, hsla(0,0%,100%,0.3) 45%, hsla(0,0%,100%,0.1) 50%, transparent 55%)" }}
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{ duration: 1.2, delay: 0.6, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Text */}
      <motion.div
        className="mt-4 text-center z-20"
        initial={{ opacity: 0, y: 20 }}
        animate={step >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h1 className="text-4xl font-bold font-cairo tracking-wide" style={{ color: "#d2ac4b" }}>مُجاز</h1>
        <motion.p
          className="text-white/70 text-sm mt-2 font-cairo"
          initial={{ opacity: 0 }}
          animate={step >= 1 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          إجازات قرآنية بالسند المتصل
        </motion.p>
      </motion.div>

      {/* Decorative line */}
      <motion.div
        className="mx-auto w-16 h-0.5 rounded-full mt-3 z-20"
        style={{ background: "linear-gradient(90deg, transparent, #d2ac4b, transparent)" }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={step >= 1 ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
        transition={{ duration: 0.6 }}
      />
    </motion.div>
  );
};

export default SplashScreen;
