import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface OnlineUser {
  user_id: string;
  role: string;
  nationality: string;
  online_at: string;
}

interface OnlineStats {
  onlineStudents: number;
  onlineReciters: number;
  onlineCountries: string[];
  loading: boolean;
}

/**
 * Subscribe to the presence channel to get live online user stats.
 * Used in admin dashboard pages.
 */
export const useOnlineUsers = (): OnlineStats => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const channel = supabase.channel("online-users", {
      config: { presence: { key: "admin-listener-" + Math.random().toString(36).slice(2) } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users: OnlineUser[] = [];
        Object.values(state).forEach((presences: any[]) => {
          presences.forEach((p) => {
            if (p.user_id && p.role) {
              users.push({
                user_id: p.user_id,
                role: p.role,
                nationality: p.nationality || "",
                online_at: p.online_at || "",
              });
            }
          });
        });
        setOnlineUsers(users);
        setLoading(false);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Track admin presence too
          await channel.track({
            user_id: "admin-listener",
            role: "admin",
            nationality: "",
            online_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  const onlineStudents = onlineUsers.filter((u) => u.role === "student").length;
  const onlineReciters = onlineUsers.filter((u) => u.role === "reciter").length;
  const onlineCountries = [
    ...new Set(
      onlineUsers
        .filter((u) => u.role === "student" && u.nationality)
        .map((u) => u.nationality)
    ),
  ];

  return { onlineStudents, onlineReciters, onlineCountries, loading };
};
