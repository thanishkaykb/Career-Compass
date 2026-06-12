import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generateResume } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-hooks";
import { toast } from "sonner";
import { Loader2, Sparkles, Download } from "lucide-react";
import {
  ModernTemplate, ProfessionalTemplate, MinimalistTemplate, CreativeTemplate, CompactTemplate,
  TemplateSelector, ResumeData
} from "@/components/ResumeTemplates";
import { usePersistedState } from "@/lib/use-persisted-state";

export const Route = createFileRoute("/_authenticated/resume-builder")({ component: ResumeBuilder });

function ResumeBuilder() {
  const { user } = useAuth();
  const gen = useServerFn(generateResume);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [f, setF] = usePersistedState("resume-builder-form", {
    fullName: "", email: "", phone: "", location: "", targetRole: "",
    summary: "", education: "", experience: "", skills: "", projects: "", certifications: "",
    githubUrl: "", linkedinUrl: "", portfolioUrl: "",
  });

  const prefilled = useRef(false);
  useEffect(() => {
    if (!user || prefilled.current) return;
    prefilled.current = true;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (!data) return;
      // Only fill fields the user hasn't typed into yet — never overwrite their input
      setF((p) => ({
        ...p,
        fullName: p.fullName || data.full_name || "",
        email: p.email || data.email || user.email || "",
        phone: p.phone || data.phone || "",
        location: p.location || data.location || "",
        githubUrl: p.githubUrl || data.github_url || "",
        linkedinUrl: p.linkedinUrl || data.linkedin_url || "",
        portfolioUrl: p.portfolioUrl || data.portfolio_url || "",
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

  const parsed = result ? (() => { try { return JSON.parse(result) as ResumeData; } catch { return null; } })() : null;

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
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Preview & Export</h2>
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold print:hidden"><Download className="h-4 w-4" />Export PDF</button>
          </div>
          
          <TemplateSelector selected={selectedTemplate} onSelect={setSelectedTemplate} />

          <div className="overflow-hidden rounded-xl border border-border shadow-2xl bg-slate-100 p-4 sm:p-8">
            <div className="print:p-0">
              {selectedTemplate === "modern" && <ModernTemplate data={parsed} />}
              {selectedTemplate === "professional" && <ProfessionalTemplate data={parsed} />}
              {selectedTemplate === "minimalist" && <MinimalistTemplate data={parsed} />}
              {selectedTemplate === "creative" && <CreativeTemplate data={parsed} />}
              {selectedTemplate === "compact" && <CompactTemplate data={parsed} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
