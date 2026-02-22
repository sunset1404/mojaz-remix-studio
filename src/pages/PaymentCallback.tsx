import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Handles 3DS redirect returns from Moyassar.
 * When 3DS requires a full-page redirect, Moyassar redirects back to this page
 * with the payment details in the URL query parameters.
 */
export default function PaymentCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        handleCallback();
    }, []);

    const handleCallback = async () => {
        try {
            if (!user) {
                navigate("/login");
                return;
            }

            const paymentId = searchParams.get("id");
            const paymentStatus = searchParams.get("status");
            const source = searchParams.get("source") || "subscription";
            const metaStr = searchParams.get("meta");

            let metadata: Record<string, any> = {};
            try {
                if (metaStr) metadata = JSON.parse(metaStr);
            } catch {
                console.warn("Failed to parse meta query param");
            }

            if (!paymentId) {
                setStatus("failed");
                setMessage("لم يتم العثور على معرف الدفع");
                return;
            }

            if (paymentStatus !== "paid") {
                setStatus("failed");
                setMessage("لم يتم إتمام عملية الدفع");

                // Update metadata status if exists
                // Note: using (supabase as any) because payment_invoice_metadata is not in generated types yet
                await (supabase as any)
                    .from("payment_invoice_metadata")
                    .update({ status: "failed" })
                    .eq("moyassar_payment_id", paymentId);
                return;
            }

            // Record payment metadata if not already recorded
            const { data: existing } = await (supabase as any)
                .from("payment_invoice_metadata")
                .select("id, processed")
                .eq("moyassar_payment_id", paymentId)
                .maybeSingle();

            if (!existing) {
                await (supabase as any).from("payment_invoice_metadata").insert({
                    user_id: user.id,
                    moyassar_payment_id: paymentId,
                    source_type: source,
                    amount_sar: metadata.amount_sar || 0,
                    metadata,
                    status: "pending",
                });
            } else if (existing.processed) {
                // Already processed — show success
                setStatus("success");
                setMessage("تم تفعيل الاشتراك بنجاح");
                return;
            }

            // Call verify-payment edge function
            const { data, error } = await supabase.functions.invoke("verify-payment", {
                body: {
                    payment_id: paymentId,
                    user_id: user.id,
                    source_type: source,
                    metadata,
                },
            });

            if (error || !data?.success) {
                throw new Error(data?.error || error?.message || "فشل التحقق من الدفع");
            }

            setStatus("success");
            setMessage("تم تفعيل الاشتراك بنجاح! 🎉");
        } catch (err: any) {
            console.error("Payment callback error:", err);
            setStatus("failed");
            setMessage(err?.message || "حدث خطأ أثناء التحقق من الدفع");
        }
    };

    const handleNavigateHome = () => {
        navigate("/");
    };

    const handleRetry = () => {
        navigate("/subscription");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass-card rounded-3xl p-8 max-w-sm w-full text-center space-y-6"
            >
                {status === "loading" && (
                    <>
                        <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
                        <h2 className="text-xl font-bold text-foreground">جاري التحقق من الدفع...</h2>
                        <p className="text-sm text-muted-foreground">يرجى الانتظار</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", damping: 15 }}
                        >
                            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                                <CheckCircle className="w-12 h-12 text-green-500" />
                            </div>
                        </motion.div>
                        <h2 className="text-xl font-bold text-foreground">تم الدفع بنجاح!</h2>
                        <p className="text-sm text-muted-foreground">{message}</p>
                        <button
                            onClick={handleNavigateHome}
                            className="w-full py-3 rounded-xl text-sm font-bold gradient-primary text-primary-foreground"
                        >
                            العودة للرئيسية
                        </button>
                    </>
                )}

                {status === "failed" && (
                    <>
                        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                            <XCircle className="w-12 h-12 text-destructive" />
                        </div>
                        <h2 className="text-xl font-bold text-foreground">فشلت عملية الدفع</h2>
                        <p className="text-sm text-muted-foreground">{message}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleRetry}
                                className="flex-1 py-3 rounded-xl text-sm font-bold gradient-primary text-primary-foreground"
                            >
                                إعادة المحاولة
                            </button>
                            <button
                                onClick={handleNavigateHome}
                                className="flex-1 py-3 rounded-xl text-sm font-bold bg-muted text-muted-foreground"
                            >
                                العودة للرئيسية
                            </button>
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    );
}
