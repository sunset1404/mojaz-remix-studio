import { useEffect, useRef } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const RECOVERY_EVENT = "mojaz:subscription-recovered";

const PaymentRecoveryListener = () => {
  const { user, role } = useAuth();
  const runningRef = useRef(false);
  const lastRunRef = useRef(0);

  useEffect(() => {
    if (!user || role !== "student") return;

    const recover = async () => {
      const now = Date.now();
      if (runningRef.current || now - lastRunRef.current < 5000) return;

      runningRef.current = true;
      lastRunRef.current = now;

      try {
        const { data, error } = await supabase.functions.invoke("recover-subscription-payments", {
          body: {},
        });

        if (error) {
          console.warn("Payment recovery skipped:", error.message);
          return;
        }

        const recovered = Number(data?.recovered || 0);
        if (recovered > 0) {
          window.dispatchEvent(
            new CustomEvent(RECOVERY_EVENT, { detail: { recovered } })
          );
        }
      } catch (error) {
        console.warn("Payment recovery skipped:", error);
      } finally {
        runningRef.current = false;
      }
    };

    void recover();

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void recover();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    let appListenerRemove: (() => void) | null = null;

    if (Capacitor.isNativePlatform()) {
      void CapacitorApp.addListener("appStateChange", ({ isActive }) => {
        if (isActive) void recover();
      }).then((handle) => {
        appListenerRemove = () => { void handle.remove(); };
      });
    }

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      appListenerRemove?.();
    };
  }, [user?.id, role]);

  return null;
};

export default PaymentRecoveryListener;
