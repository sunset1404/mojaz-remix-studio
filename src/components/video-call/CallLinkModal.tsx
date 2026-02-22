import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Share2, Video, CheckCircle2, X, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CallLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    callLink: string;
    calleeName: string;
    onStartCall: () => void;
}

export function CallLinkModal({
    isOpen,
    onClose,
    callLink,
    calleeName,
    onStartCall,
}: CallLinkModalProps) {
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(callLink);
            setCopied(true);
            toast({
                title: "تم النسخ",
                description: "تم نسخ الرابط إلى الحافظة",
            });
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast({
                title: "خطأ",
                description: "فشل في نسخ الرابط",
                variant: "destructive",
            });
        }
    };

    const handleWhatsAppShare = () => {
        const message = encodeURIComponent(
            `مرحباً ${calleeName},\n\nيرجى الانضمام للمكالمة المرئية عبر الرابط التالي:\n${callLink}\n\nملاحظة: الرابط صالح لاستخدام واحد فقط`
        );
        window.open(`https://wa.me/?text=${message}`, "_blank");
    };

    const handleStartCallAndClose = () => {
        onStartCall();
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-card w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 space-y-5"
                        dir="rtl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Video className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground">رابط المكالمة جاهز</h3>
                                    <p className="text-xs text-muted-foreground">شارك الرابط مع {calleeName}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Link display */}
                        <div className="bg-muted/50 rounded-xl p-3 flex items-center gap-2">
                            <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                            <input
                                value={callLink}
                                readOnly
                                dir="ltr"
                                className="flex-1 bg-transparent text-sm text-foreground font-mono truncate outline-none"
                            />
                            <button
                                onClick={handleCopy}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${copied
                                        ? "bg-green-500 text-white"
                                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                                    }`}
                            >
                                {copied ? (
                                    <span className="flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        تم
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1">
                                        <Copy className="w-3.5 h-3.5" />
                                        نسخ
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Share options */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleWhatsAppShare}
                                className="flex items-center justify-center gap-2 p-3 rounded-xl border border-border hover:bg-muted/50 transition-all text-sm font-medium"
                            >
                                <Share2 className="w-4 h-4 text-green-500" />
                                واتساب
                            </button>
                            <button
                                onClick={handleCopy}
                                className="flex items-center justify-center gap-2 p-3 rounded-xl border border-border hover:bg-muted/50 transition-all text-sm font-medium"
                            >
                                <Copy className="w-4 h-4 text-primary" />
                                نسخ الرابط
                            </button>
                        </div>

                        {/* Note */}
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-xl p-3">
                            <p className="text-xs text-amber-700 dark:text-amber-300">
                                <strong>ملاحظة:</strong> هذا الرابط صالح لاستخدام واحد فقط وسينتهي عند انتهاء المكالمة
                            </p>
                        </div>

                        {/* Start call button */}
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={handleStartCallAndClose}
                            className="w-full py-3.5 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-bold text-base flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-500/20"
                        >
                            <Video className="w-5 h-5" />
                            بدء المكالمة
                        </motion.button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
