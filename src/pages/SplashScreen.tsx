import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logoMojaz from "@/assets/logo-mojaz-new.png";

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const [phase, setPhase] = useState<"logo" | "text" | "exit">("logo");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("text"), 1200);
    const t2 = setTimeout(() => setPhase("exit"), 3000);
    const t3 = setTimeout(onFinish, 3600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onFinish]);

  return (
    <AnimatePresence>
      {phase !== "exit" ? (
        <motion.div
          key="splash"
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{
            background: "linear-gradient(170deg, hsl(174 42% 28%) 0%, hsl(174 42% 35%) 30%, hsl(174 38% 40%) 55%, hsl(174 35% 38%) 80%, hsl(174 30% 32%) 100%)",
          }}
        >
          {/* Decorative particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 4 + i * 3,
                height: 4 + i * 3,
                background: `hsla(43, 50%, 55%, ${0.15 + i * 0.05})`,
                top: `${15 + i * 13}%`,
                left: `${10 + (i % 3) * 30}%`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0.5, 1],
                scale: [0, 1.2, 0.8, 1],
                y: [0, -10, 5, 0],
              }}
              transition={{
                duration: 2.5,
                delay: 0.3 + i * 0.15,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          ))}

          {/* Radial glow behind logo */}
          <motion.div
            className="absolute"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.3, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{
              width: 320,
              height: 320,
              borderRadius: "50%",
              background: "radial-gradient(circle, hsl(43 50% 55% / 0.25) 0%, transparent 70%)",
            }}
          />

          {/* Logo */}
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 120,
              damping: 14,
              delay: 0.1,
            }}
            className="relative z-10"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-36 h-36 rounded-[2rem] overflow-hidden border-2 border-white/20 shadow-2xl bg-white/95 p-3 backdrop-blur-sm"
            >
              <img
                src={logoMojaz}
                alt="مجاز"
                className="w-full h-full object-contain"
              />
            </motion.div>

            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div
                className="absolute w-full h-full"
                style={{
                  background: "linear-gradient(105deg, transparent 40%, hsla(0,0%,100%,0.3) 45%, hsla(0,0%,100%,0.1) 50%, transparent 55%)",
                }}
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{ duration: 1.2, delay: 0.6, ease: "easeInOut" }}
              />
            </motion.div>
          </motion.div>

          {/* App name */}
          <motion.div
            className="relative z-10 mt-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={phase === "text" ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h1
              className="text-4xl font-bold font-cairo tracking-wide"
              style={{ color: "#d2ac4b" }}
            >
              مُجاز
            </h1>
            <motion.p
              className="text-white/70 text-sm mt-2 font-cairo"
              initial={{ opacity: 0 }}
              animate={phase === "text" ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              إجازات قرآنية بالسند المتصل
            </motion.p>
          </motion.div>

          {/* Bottom decorative line */}
          <motion.div
            className="absolute bottom-16 w-16 h-0.5 rounded-full"
            style={{ background: "linear-gradient(90deg, transparent, #d2ac4b, transparent)" }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={phase === "text" ? { scaleX: 1, opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default SplashScreen;
