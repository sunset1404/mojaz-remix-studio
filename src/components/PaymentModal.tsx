import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { initMoyasarForm, buildCallbackUrl, type MoyasarPaymentResponse } from "@/lib/moyassar";

type PaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  price: number | string;
  period?: string;
  onConfirm?: () => void;
  subscriptionType?: string;
  durationMonths?: number;
  sourceType?: "subscription" | "gift" | "extra_hours";
  metadata?: Record<string, any>;
};

const PaymentModal = ({
  isOpen,
  onClose,
  planName,
  price,
  period,
  subscriptionType,
  durationMonths,
  sourceType = "subscription",
  metadata = {},
}: PaymentModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [paymentState, setPaymentState] = useState<"form" | "verifying" | "success" | "error">("form");
  const [errorMessage, setErrorMessage] = useState("");
  const formInitialized = useRef(false);
  const moyasarContainerId = "moyasar-payment-form";
  const paymentRefLocal = useRef<string | null>(null);

  useEffect(() => {
    if (isOpen && paymentState === "form" && !formInitialized.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        initPaymentForm();
      }, 300);
      return () => clearTimeout(timer);
    }

    if (!isOpen) {
      formInitialized.current = false;
      setPaymentState("form");
      setErrorMessage("");
      paymentRefLocal.current = null;
    }
  }, [isOpen, paymentState]);

  const initPaymentForm = async () => {
    if (!user || formInitialized.current) return;

    // Mark as initialized immediately to prevent concurrent calls
    formInitialized.current = true;

    // Fetch student profile info for metadata
    const { data: profile } = await supabase
      .from("student_profiles")
      .select("full_name, phone")
      .eq("user_id", user.id)
      .maybeSingle();

    const months = durationMonths || (period?.includes("سنو") ? 12 : 1);

    const baseMetadata = {
      ...metadata,
      student_name: profile?.full_name || "طالب",
      student_phone: profile?.phone || null,
      subscription_type: subscriptionType || planName,
      plan_name: planName,
      duration_months: months,
    };

    try {
      // Create payment record server-side (validated amount)
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke("create-payment", {
        body: {
          source_type: sourceType,
          plan_name: planName,
          duration_months: months,
          metadata: baseMetadata,
          hours: metadata?.hours,
          package_label: metadata?.package_label,
        },
      });

      if (paymentError || !paymentData?.payment_ref) {
        throw new Error(paymentError?.message || "تعذر إنشاء سجل الدفع");
      }

      const validatedAmount = Number(paymentData.amount_sar);
      const paymentMetadata = {
        ...baseMetadata,
        ...paymentData.metadata,
        amount_sar: validatedAmount,
        payment_ref: paymentData.payment_ref,
      };

      paymentRefLocal.current = paymentData.payment_ref;
      const callbackUrl = buildCallbackUrl(sourceType, paymentMetadata);

      // Ensure the container is present in the DOM before initializing
      const container = document.getElementById(moyasarContainerId);
      if (!container) {
        throw new Error("Moyassar container element not found");
      }
      // Clear container to resolve React 18 StrictMode double mount issues
      container.innerHTML = "";

      console.log("Moyassar init: element exists =", !!container, "SDK loaded =", !!window.Moyasar, "amount =", validatedAmount);

      await initMoyasarForm({
        elementId: moyasarContainerId,
        amountSar: validatedAmount,
        description: `اشتراك ${planName}`,
        callbackUrl,
        methods: ["creditcard", "stcpay"],
        metadata: { payment_ref: paymentData.payment_ref },
        onCompleted: (payment: MoyasarPaymentResponse) => {
          handlePaymentCompleted(payment, paymentMetadata);
        },
        onFailure: (error: any) => {
          console.error("Payment failed:", error);
          setPaymentState("error");
          setErrorMessage(error?.message || typeof error === "string" ? String(error) : "فشلت عملية الدفع");
        },
      });

      // Timeout: if the form is still showing "Loading" after 8 seconds, show error
      setTimeout(() => {
        const container = document.getElementById(moyasarContainerId);
        if (container && container.textContent?.trim() === "Loading") {
          setPaymentState("error");
          setErrorMessage("تعذر تحميل نموذج الدفع. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.");
        }
      }, 8000);
    } catch (err) {
      console.error("Failed to init Moyassar:", err);
      // Revert flag to allow retry
      formInitialized.current = false;
      setPaymentState("error");
      setErrorMessage("تعذر تحميل نموذج الدفع");
    }
  };

  const handlePaymentCompleted = async (
    payment: MoyasarPaymentResponse,
    paymentMetadata: Record<string, any>
  ) => {
    setPaymentState("verifying");

    try {
      const ref = paymentMetadata.payment_ref || paymentRefLocal.current;
      if (!ref) {
        throw new Error("مرجع الدفع غير متوفر");
      }

      // 1. Update payment metadata with Moyassar payment ID
      await (supabase as any)
        .from("payment_invoice_metadata")
        .update({
          moyassar_payment_id: payment.id,
          status: "pending",
          metadata: paymentMetadata,
        })
        .eq("id", ref);

      // 2. Call verify-payment edge function
      const { data, error } = await supabase.functions.invoke("verify-payment", {
        body: {
          payment_id: payment.id,
          payment_ref: ref,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "فشل التحقق من الدفع");

      setPaymentState("success");
      toast({ title: "تم الدفع بنجاح! 🎉" });

      // Auto-close after success animation
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err: any) {
      console.error("Verification error:", err);
      setPaymentState("error");
      setErrorMessage(err?.message || "تعذر التحقق من الدفع");
    }
  };

  const handleRetry = () => {
    formInitialized.current = false;
    setPaymentState("form");
    setErrorMessage("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={paymentState === "form" ? onClose : undefined}
            className="fixed inset-0 bg-black/60 z-[60]"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0, transition: { type: "spring", damping: 28, stiffness: 300 } }}
            exit={{ y: "100%", opacity: 0, transition: { duration: 0, ease: "linear" } }}
            className="fixed inset-x-0 max-w-md mx-auto z-[70] bg-background rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
            style={{
              bottom: "68px",
              maxHeight: "calc(100dvh - 108px)",
            }}
          >
            {/* Fixed Header */}
            <div className="flex-shrink-0 px-5 pt-4 pb-2">
              <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-3" />
              {paymentState === "form" && (
                <button
                  onClick={onClose}
                  className="absolute top-4 left-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
              <h2 className="text-base font-bold text-foreground text-center">إتمام الدفع</h2>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3">
              {paymentState === "success" ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 gap-4"
                >
                  <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                  </div>
                  <p className="text-lg font-bold text-foreground">تم الدفع بنجاح!</p>
                  <p className="text-sm text-muted-foreground text-center">
                    اشتراكك في <strong>{planName}</strong> قيد التفعيل
                  </p>
                </motion.div>
              ) : paymentState === "verifying" ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  <p className="text-lg font-bold text-foreground">جاري التحقق من الدفع...</p>
                  <p className="text-sm text-muted-foreground">يرجى الانتظار</p>
                </div>
              ) : paymentState === "error" ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertCircle className="w-12 h-12 text-destructive" />
                  </div>
                  <p className="text-lg font-bold text-foreground">فشلت عملية الدفع</p>
                  <p className="text-sm text-muted-foreground text-center">{errorMessage}</p>
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={handleRetry}
                      className="flex-1 py-3 rounded-xl text-sm font-bold gradient-primary text-primary-foreground"
                    >
                      إعادة المحاولة
                    </button>
                    <button
                      onClick={onClose}
                      className="flex-1 py-3 rounded-xl text-sm font-bold bg-muted text-muted-foreground"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Order Summary */}
                  <div className="glass-card rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">الباقة</span>
                      <span className="text-sm font-bold text-foreground">{planName}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-muted-foreground">المبلغ</span>
                      <span className="text-lg font-extrabold text-foreground">
                        {price}{" "}
                        <span className="text-sm font-normal text-muted-foreground">
                          ريال{period ? ` / ${period}` : ""}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Moyassar Payment Form Container */}
                  <div id={moyasarContainerId} className="mysr-form min-h-[400px] w-full">
                    {/* Loading skeleton while Moyasar SDK initializes */}
                    <div className="space-y-4 animate-pulse">
                      <div className="h-10 bg-muted rounded-lg w-full" />
                      <div className="h-10 bg-muted rounded-lg w-full" />
                      <div className="flex gap-3">
                        <div className="h-10 bg-muted rounded-lg flex-1" />
                        <div className="h-10 bg-muted rounded-lg flex-1" />
                      </div>
                      <div className="h-12 bg-muted rounded-xl w-full mt-2" />
                    </div>
                  </div>

                  {/* Security Badge */}
                  <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <Lock className="w-3.5 h-3.5" />
                    <span>جميع المدفوعات مشفرة وآمنة</span>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PaymentModal;
