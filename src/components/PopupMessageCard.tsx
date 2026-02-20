import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type PopupMessage = {
  id: string;
  title: string;
  message: string;
  icon: string;
  color_scheme: string;
};

const COLOR_GRADIENTS: Record<string, string> = {
  gold: "from-yellow-400 to-amber-500",
  green: "from-emerald-400 to-green-600",
  blue: "from-blue-400 to-indigo-600",
  purple: "from-purple-400 to-violet-600",
  teal: "from-teal-400 to-cyan-600",
};

const getGradient = (scheme: string) =>
  COLOR_GRADIENTS[scheme] ?? COLOR_GRADIENTS.gold;

type Props = {
  message: PopupMessage | null;
  onClose: () => void;
};

const PopupMessageCard = ({ message, onClose }: Props) => {
  return (
    <AnimatePresence>
      {message && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Card */}
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 80, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed bottom-28 left-0 right-0 mx-auto z-50 w-full max-w-sm px-4"
            dir="rtl"
          >
            <div className={`bg-gradient-to-br ${getGradient(message.color_scheme)} p-0.5 rounded-3xl shadow-2xl`}>
              <div className="bg-card rounded-3xl p-6 relative overflow-hidden">
                {/* Decorative blobs */}
                <div className={`absolute -top-6 -left-6 w-24 h-24 rounded-full bg-gradient-to-br ${getGradient(message.color_scheme)} opacity-10 blur-xl`} />
                <div className={`absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-gradient-to-br ${getGradient(message.color_scheme)} opacity-10 blur-lg`} />

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute left-4 top-4 w-8 h-8 rounded-full bg-muted/80 flex items-center justify-center z-10"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>

                <div className="text-center relative z-10">
                  {/* Icon bubble */}
                  <motion.div
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
                    className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${getGradient(message.color_scheme)} flex items-center justify-center mx-auto mb-4 text-4xl shadow-lg`}
                  >
                    {message.icon}
                  </motion.div>

                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 }}
                    className="text-xl font-bold text-foreground mb-2"
                  >
                    {message.title}
                  </motion.h3>

                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="text-sm text-muted-foreground leading-relaxed"
                  >
                    {message.message}
                  </motion.p>

                  <motion.button
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.32 }}
                    onClick={onClose}
                    className={`mt-5 w-full py-3.5 rounded-2xl bg-gradient-to-r ${getGradient(message.color_scheme)} text-white font-bold text-sm shadow-lg active:scale-95 transition-transform`}
                  >
                    رائع! شكراً 🎊
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PopupMessageCard;
