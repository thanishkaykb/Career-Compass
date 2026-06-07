import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generateResume } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-hooks";
import { toast } from "sonner";
import { Loader2, Sparkles, Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/resume-builder")({ component: ResumeBuilder });

function ResumeBuilder() {
  const { user } = useAuth();
  const gen = useServerFn(generateResume);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [f, setF] = useState({
    fullName: "", email: "", phone: "", location: "", targetRole: "",
    summary: "", education: "", experience: "", skills: "", projects: "", certifications: "",
    githubUrl: "", linkedinUrl: "", portfolioUrl: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (!data) return;
      setF((p) => ({
        ...p,
        fullName: data.full_name || "",
        email: data.email || user.email || "",
        phone: data.phone || "",
        location: data.location || "",
        githubUrl: data.github_url || "",
        linkedinUrl: data.linkedin_url || "",
        portfolioUrl: data.portfolio_url || "",
      }));
    });
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const r = await gen({ data: f });
      setResult(r.resume);
      toast.success("Resume generated and saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally { setLoading(false); }
  };

  const inp = (k: keyof typeof f, label: string, area = false, ph = "") => (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      {area ? (
        <textarea value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} rows={3} placeholder={ph}
          className="mt-1 w-full rounded-xl bg-surface-2 px-3 py-2.5 text-sm border border-border focus:border-primary outline-none" />
      ) : (
        <input value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} placeholder={ph}
          className="mt-1 w-full rounded-xl bg-surface-2 px-3 py-2.5 text-sm border border-border focus:border-primary outline-none" />
      )}
    </label>
  );

  const parsed = result ? (() => { try { return JSON.parse(result); } catch { return null; } })() : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="display text-3xl font-bold flex items-center gap-2"><Sparkles className="h-7 w-7 text-primary" />Resume Builder</h1>
      <p className="text-sm text-muted-foreground mt-1">Fill in your real info. We'll pull from your GitHub link if you add one. No fabricated experience.</p>

      <form onSubmit={submit} className="mt-6 glass rounded-2xl p-6 grid gap-3 sm:grid-cols-2">
        {inp("fullName", "Full name *")}
        {inp("email", "Email *")}
        {inp("phone", "Phone")}
        {inp("location", "Location")}
        <div className="sm:col-span-2">{inp("targetRole", "Target role *", false, "e.g. Full Stack Developer")}</div>
        <div className="sm:col-span-2">{inp("summary", "About you (one paragraph)", true, "Who you are, what you do well")}</div>
        <div className="sm:col-span-2">{inp("experience", "Work experience", true, "List jobs: title, company, dates, what you did")}</div>
        <div className="sm:col-span-2">{inp("education", "Education", true, "Degree, school, dates")}</div>
        {inp("skills", "Skills", true, "Comma separated")}
        {inp("certifications", "Certifications", true)}
        <div className="sm:col-span-2">{inp("projects", "Projects", true, "Name + what it does + tech stack")}</div>
        {inp("githubUrl", "GitHub URL (auto-fetched)")}
        {inp("linkedinUrl", "LinkedIn URL")}
        <div className="sm:col-span-2">{inp("portfolioUrl", "Portfolio URL")}</div>

        <div className="sm:col-span-2 flex justify-end">
          <button disabled={loading} className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60 flex items-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}Generate Resume
          </button>
        </div>
      </form>

      {parsed && (
        <div className="mt-6 glass rounded-2xl p-8 bg-white text-black">
          <div className="text-center border-b pb-4 mb-4">
            <h2 className="text-2xl font-bold">{parsed.fullName}</h2>
            {parsed.headline && <p className="text-sm">{parsed.headline}</p>}
            <p className="text-xs text-gray-600 mt-1">
              {[parsed.email, parsed.phone, parsed.location].filter(Boolean).join(" • ")}
            </p>
          </div>
          {parsed.summary && (<section className="mb-4"><h3 className="font-bold text-sm uppercase tracking-wide">Summary</h3><p className="text-sm mt-1">{parsed.summary}</p></section>)}
          {parsed.skills?.length > 0 && (<section className="mb-4"><h3 className="font-bold text-sm uppercase tracking-wide">Skills</h3><p className="text-sm mt-1">{parsed.skills.join(" • ")}</p></section>)}
          {parsed.experience?.length > 0 && (
            <section className="mb-4">
              <h3 className="font-bold text-sm uppercase tracking-wide">Experience</h3>
              {parsed.experience.map((x: { title?: string; company?: string; startDate?: string; endDate?: string; bullets?: string[] }, i: number) => (
                <div key={i} className="mt-2">
                  <div className="flex justify-between text-sm"><strong>{x.title} — {x.company}</strong><span>{x.startDate} – {x.endDate}</span></div>
                  <ul className="list-disc ml-5 text-sm">{x.bullets?.map((b, j) => <li key={j}>{b}</li>)}</ul>
                </div>
              ))}
            </section>
          )}
          {parsed.education?.length > 0 && (
            <section className="mb-4">
              <h3 className="font-bold text-sm uppercase tracking-wide">Education</h3>
              {parsed.education.map((x: { degree?: string; school?: string; startDate?: string; endDate?: string }, i: number) => (
                <p key={i} className="text-sm mt-1">{x.degree} — {x.school} ({x.startDate} – {x.endDate})</p>
              ))}
            </section>
          )}
          {parsed.projects?.length > 0 && (
            <section className="mb-4">
              <h3 className="font-bold text-sm uppercase tracking-wide">Projects</h3>
              {parsed.projects.map((x: { name?: string; description?: string; tech?: string[] }, i: number) => (
                <div key={i} className="text-sm mt-1"><strong>{x.name}</strong> — {x.description} {x.tech?.length ? <em>({x.tech.join(", ")})</em> : null}</div>
              ))}
            </section>
          )}
          <button onClick={() => window.print()} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-black text-white px-4 py-2 text-xs print:hidden"><Download className="h-3.5 w-3.5" />Print / Save as PDF</button>
        </div>
      )}
    </div>
  );
}
