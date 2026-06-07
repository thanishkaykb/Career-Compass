import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-hooks";
import { toast } from "sonner";
import { Plus, Trash2, Users, Building2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/recruiter")({ component: Recruiter });

function Recruiter() {
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);
  const [profileMissing, setProfileMissing] = useState(false);
  const [form, setForm] = useState({ title: "", company: "", location: "", employment_type: "Full-time", salary_range: "", description: "", responsibilities: "", requirements: "", skills: "" });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("company_name, full_name").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (!data?.company_name || !data?.full_name) setProfileMissing(true);
      else setForm((f) => ({ ...f, company: f.company || data.company_name || "" }));
    });
  }, [user]);

  const { data: jobs } = useQuery({
    queryKey: ["my-jobs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("jobs").select("*").eq("recruiter_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: applications } = useQuery({
    queryKey: ["applications-for-job", viewing],
    enabled: !!viewing,
    queryFn: async () => {
      const { data, error } = await supabase.from("applications").select("*").eq("job_id", viewing!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (role && role !== "recruiter") {
    return <div className="mx-auto max-w-2xl px-4 py-12 text-center"><p className="text-muted-foreground">This area is for recruiters only.</p></div>;
  }

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("jobs").insert({
      recruiter_id: user.id,
      title: form.title, company: form.company, location: form.location,
      employment_type: form.employment_type, salary_range: form.salary_range,
      description: form.description, responsibilities: form.responsibilities, requirements: form.requirements,
      skills: form.skills ? form.skills.split(",").map((s) => s.trim()).filter(Boolean) : null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Job posted");
    setShowNew(false);
    setForm({ title: "", company: form.company, location: "", employment_type: "Full-time", salary_range: "", description: "", responsibilities: "", requirements: "", skills: "" });
    qc.invalidateQueries({ queryKey: ["my-jobs"] });
  };

  const del = async (id: string) => {
    if (!confirm("Delete this job posting?")) return;
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Job deleted");
    qc.invalidateQueries({ queryKey: ["my-jobs"] });
  };

  const updateStatus = async (appId: string, status: string) => {
    const { error } = await supabase.from("applications").update({ status }).eq("id", appId);
    if (error) { toast.error(error.message); return; }
    toast.success(`Marked as ${status}`);
    qc.invalidateQueries({ queryKey: ["applications-for-job", viewing] });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="display text-3xl font-bold flex items-center gap-2"><Building2 className="h-7 w-7 text-primary" />Recruiter Dashboard</h1>
        <button onClick={() => setShowNew(true)} disabled={profileMissing} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 flex items-center gap-2"><Plus className="h-4 w-4" />New job</button>
      </div>

      {profileMissing && (
        <div className="mt-4 rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 text-sm">
          Please complete your <a href="/profile" className="text-primary font-medium">profile</a> (name + company) before posting jobs.
        </div>
      )}

      <div className="mt-6 space-y-3">
        {jobs?.length === 0 && <p className="text-sm text-muted-foreground">No jobs yet — post your first one.</p>}
        {jobs?.map((j) => (
          <div key={j.id} className="glass rounded-2xl p-5">
            <div className="flex justify-between items-start gap-3 flex-wrap">
              <div>
                <h3 className="display text-lg font-bold">{j.title}</h3>
                <p className="text-sm text-muted-foreground">{j.company} • {j.location}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setViewing(j.id)} className="rounded-lg bg-surface-2 px-3 py-2 text-xs flex items-center gap-1"><Users className="h-3.5 w-3.5" />Applications</button>
                <button onClick={() => del(j.id)} className="rounded-lg bg-destructive/10 text-destructive px-3 py-2 text-xs flex items-center gap-1"><Trash2 className="h-3.5 w-3.5" />Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showNew && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowNew(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={create} className="glass rounded-2xl p-6 w-full max-w-xl space-y-3 max-h-[90vh] overflow-y-auto">
            <h2 className="display text-xl font-bold">Post a new job</h2>
            {(["title","company","location","employment_type","salary_range"] as const).map((k) => (
              <input key={k} required={k === "title" || k === "company"} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                placeholder={k.replace("_", " ")} className="w-full rounded-xl bg-surface-2 px-3 py-2.5 text-sm border border-border" />
            ))}
            <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Description" className="w-full rounded-xl bg-surface-2 px-3 py-2.5 text-sm border border-border" />
            <textarea value={form.responsibilities} onChange={(e) => setForm({ ...form, responsibilities: e.target.value })} rows={3} placeholder="Responsibilities" className="w-full rounded-xl bg-surface-2 px-3 py-2.5 text-sm border border-border" />
            <textarea value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} rows={3} placeholder="Requirements" className="w-full rounded-xl bg-surface-2 px-3 py-2.5 text-sm border border-border" />
            <input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="Skills (comma separated)" className="w-full rounded-xl bg-surface-2 px-3 py-2.5 text-sm border border-border" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowNew(false)} className="rounded-xl px-4 py-2 text-sm text-muted-foreground">Cancel</button>
              <button className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Post job</button>
            </div>
          </form>
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setViewing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="glass rounded-2xl p-6 w-full max-w-2xl space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="display text-xl font-bold">Applications</h2>
              <button onClick={() => setViewing(null)} className="text-muted-foreground text-xs">Close</button>
            </div>
            {applications?.length === 0 && <p className="text-sm text-muted-foreground">No applications yet.</p>}
            {applications?.map((a) => (
              <div key={a.id} className="rounded-xl bg-surface-2 p-4">
                <div className="flex justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-semibold">{a.full_name}</p>
                    <p className="text-xs text-muted-foreground">{a.email} {a.phone && `• ${a.phone}`}</p>
                  </div>
                  <span className="text-xs rounded-full bg-primary/15 text-primary px-2.5 py-1 self-start">{a.status}</span>
                </div>
                {a.cover_letter && <p className="mt-2 text-sm whitespace-pre-line">{a.cover_letter}</p>}
                {a.resume_content && typeof a.resume_content === "object" && "text" in a.resume_content && (
                  <details className="mt-2"><summary className="text-xs text-primary cursor-pointer">View resume</summary><pre className="mt-2 text-xs whitespace-pre-wrap text-muted-foreground">{String((a.resume_content as { text: string }).text)}</pre></details>
                )}
                <div className="mt-3 flex gap-2">
                  <button onClick={() => updateStatus(a.id, "shortlisted")} className="rounded-lg bg-primary/15 text-primary px-3 py-1.5 text-xs">Shortlist</button>
                  <button onClick={() => updateStatus(a.id, "rejected")} className="rounded-lg bg-destructive/15 text-destructive px-3 py-1.5 text-xs">Reject</button>
                  <button onClick={() => updateStatus(a.id, "hired")} className="rounded-lg bg-surface-3 px-3 py-1.5 text-xs">Hired</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
