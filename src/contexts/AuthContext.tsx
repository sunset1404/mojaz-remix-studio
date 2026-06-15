import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
type ReciterType = "ijazah" | "general" | null;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  reciterType: ReciterType;
  reciterStatus: string | null;
  avatarUrl: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshAvatar: () => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  reciterType: null,
  reciterStatus: null,
  avatarUrl: null,
  loading: true,
  signOut: async () => {},
  refreshAvatar: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [reciterType, setReciterType] = useState<ReciterType>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = (userId: string) => {
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        const r = data?.role ?? null;
        setRole(r);
        if (r === "reciter") {
          fetchReciterType(userId);
        } else {
          setReciterType(null);
        }
      });
  };

  const fetchReciterType = (userId: string) => {
    supabase
      .from("reciter_profiles")
      .select("reciter_type")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        setReciterType((data as any)?.reciter_type ?? null);
      });
  };

  const fetchAvatar = (userId: string) => {
    supabase
      .from("profiles")
      .select("avatar_url")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.avatar_url) {
          const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(data.avatar_url);
          if (urlData?.publicUrl) setAvatarUrl(urlData.publicUrl);
        } else {
          setAvatarUrl(null);
        }
      });
  };

  const refreshAvatar = () => {
    if (user) fetchAvatar(user.id);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user.id);
        fetchAvatar(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user.id);
        fetchAvatar(session.user.id);
      } else {
        setRole(null);
        setReciterType(null);
        setAvatarUrl(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, role, reciterType, avatarUrl, loading, signOut, refreshAvatar }}>
      {children}
    </AuthContext.Provider>
  );
};
