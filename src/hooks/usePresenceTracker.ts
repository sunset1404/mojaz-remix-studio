import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Tracks current user's presence in a Realtime channel.
 * Broadcasts role + nationality so admin can see who's online.
 */
export const usePresenceTracker = () => {
  const { user, role } = useAuth();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user || !role) {
      // Cleanup if user logs out
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    const channel = supabase.channel("online-users", {
      config: { presence: { key: user.id } },
    });

    // We'll fetch nationality for students
    const trackPresence = async () => {
      let nationality = "";
      if (role === "student") {
        const { data } = await supabase
          .from("student_profiles")
          .select("nationality")
          .eq("user_id", user.id)
          .maybeSingle();
        nationality = data?.nationality || "";
      }

      channel
        .on("presence", { event: "sync" }, () => {})
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await channel.track({
              user_id: user.id,
              role,
              nationality,
              online_at: new Date().toISOString(),
            });
          }
        });

      channelRef.current = channel;
    };

    trackPresence();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, role]);
};
