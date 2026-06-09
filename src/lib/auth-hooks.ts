import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type Role = "job_seeker" | "recruiter";
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (u: User | null) => {
    setUser(u);
    if (u) {
      const [roleRes, profileRes] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", u.id).maybeSingle(),
        supabase.from("profiles").select("*").eq("id", u.id).maybeSingle()
      ]);
      
      setRole((roleRes.data?.role as Role) ?? "job_seeker");
      setProfile(profileRes.data);
    } else {
      setRole(null);
      setProfile(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) load(data.user ?? null);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (mounted) load(session?.user ?? null);
    });
    
    return () => { 
      mounted = false; 
      subscription.unsubscribe(); 
    };
  }, [load]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      setProfile(data);
    }
  }, [user]);

  return { user, role, profile, loading, refreshProfile };
}
