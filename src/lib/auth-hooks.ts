import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type Role = "job_seeker" | "recruiter";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async (u: User | null) => {
      if (!mounted) return;
      setUser(u);
      if (u) {
        const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.id).maybeSingle();
        if (mounted) setRole((data?.role as Role) ?? "job_seeker");
      } else {
        setRole(null);
      }
      if (mounted) setLoading(false);
    };
    supabase.auth.getUser().then(({ data }) => load(data.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      load(session?.user ?? null);
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  return { user, role, loading };
}
