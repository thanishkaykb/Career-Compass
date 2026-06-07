import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-hooks";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({ component: ProfilePage });

function ProfilePage() {
  const { user, role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [p, setP] = useState({
    full_name: "", phone: "", location: "", headline: "", bio: "",
    github_url: "", linkedin_url: "", portfolio_url: "",
    company_name: "", company_website: "", recruiter_title: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) setP((prev) => ({ ...prev, ...Object.fromEntries(Object.entries(data).filter(([k]) => k in prev).map(([k, v]) => [k, v ?? ""])) }));
      setLoading(false);
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update(p).eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Profile saved");
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const field = (k: keyof typeof p, label: string, type = "text") => (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input type={type} value={p[k]} onChange={(e) => setP({ ...p, [k]: e.target.value })}
        className="mt-1 w-full rounded-xl bg-surface-2 px-3 py-2.5 text-sm border border-border focus:border-primary outline-none" />
    </label>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="display text-3xl font-bold">Your profile</h1>
      <p className="text-sm text-muted-foreground mt-1">{role === "recruiter" ? "Add your company info before posting jobs." : "Keep this current — it powers resume generation."}</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {field("full_name", "Full name")}
        {field("phone", "Phone")}
        {field("location", "Location")}
        {field("headline", "Headline / role")}
      </div>
      <div className="mt-3">
        <label className="block">
          <span className="text-xs text-muted-foreground">Short bio</span>
          <textarea value={p.bio} onChange={(e) => setP({ ...p, bio: e.target.value })} rows={3}
            className="mt-1 w-full rounded-xl bg-surface-2 px-3 py-2.5 text-sm border border-border focus:border-primary outline-none" />
        </label>
      </div>

      {role === "job_seeker" && (
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {field("github_url", "GitHub URL")}
          {field("linkedin_url", "LinkedIn URL")}
          {field("portfolio_url", "Portfolio URL")}
        </div>
      )}

      {role === "recruiter" && (
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {field("company_name", "Company")}
          {field("company_website", "Company website")}
          {field("recruiter_title", "Your title")}
        </div>
      )}

      <button onClick={save} disabled={saving} className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
        {saving ? "Saving…" : "Save profile"}
      </button>
    </div>
  );
}
