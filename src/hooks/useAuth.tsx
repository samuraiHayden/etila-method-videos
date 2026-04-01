import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type AppRole = "super_admin" | "coach" | "content_admin" | "client";

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  height: string | null;
  current_weight: string | null;
  goal_weight: string | null;
  starting_weight: string | null;
  goals: string[] | null;
  injuries: string | null;
  experience_level: string | null;
  program_start_date: string | null;
  status: string | null;
  assigned_coach_id: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async (userId: string, accessToken: string) => {
    try {
      const headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      };

      // Use direct fetch to avoid Supabase JS client internal lock contention
      const [roleRes, profileRes] = await Promise.all([
        fetch(
          `${SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${userId}&select=role&limit=1`,
          { headers }
        ).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(
          `${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${userId}&select=*&limit=1`,
          { headers }
        ).then(r => r.ok ? r.json() : null).catch(() => null),
      ]);

      const newRole = Array.isArray(roleRes) && roleRes.length > 0
        ? (roleRes[0].role as AppRole) ?? null
        : null;
      const profileRow = Array.isArray(profileRes) && profileRes.length > 0
        ? (profileRes[0] as Profile)
        : null;

      if (newRole !== null) {
        setRole(newRole);
      }
      setProfile(profileRow ?? null);
    } catch (e) {
      console.error("fetchUserData failed:", e);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData as Profile);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    let bootstrapped = false;

    const handleSession = async (session: Session | null, isSignOut = false) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user && session.access_token) {
        await fetchUserData(session.user.id, session.access_token);
      } else if (isSignOut) {
        // Only clear role on explicit sign-out
        setRole(null);
        setProfile(null);
      }
    };

    // Listen for auth changes FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        // INITIAL_SESSION is handled by getSession below — skip to avoid double-fetch
        if (event === "INITIAL_SESSION") return;

        // On token refresh, just update session/user — don't re-fetch role (avoid disruption)
        if (event === "TOKEN_REFRESHED") {
          setSession(session);
          setUser(session?.user ?? null);
          return;
        }

        // On sign out, clear everything
        if (event === "SIGNED_OUT") {
          setSession(null);
          setUser(null);
          setRole(null);
          setProfile(null);
          return;
        }

        // On sign in / user update, fetch fresh data
        if (event === "SIGNED_IN" || event === "USER_UPDATED") {
          setIsLoading(true);
          try {
            await handleSession(session);
          } catch (e) {
            console.error("onAuthStateChange handler failed:", e);
          } finally {
            if (isMounted) setIsLoading(false);
          }
        }
      }
    );

    // Bootstrap session ONCE on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted || bootstrapped) return;
      bootstrapped = true;
      try {
        await handleSession(session);
      } catch (e) {
        console.error("getSession bootstrap failed:", e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setProfile(null);
  };

  const isAdmin = role === "super_admin" || role === "coach" || role === "content_admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        isAdmin,
        isLoading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
