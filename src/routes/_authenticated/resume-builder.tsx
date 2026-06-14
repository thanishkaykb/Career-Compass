import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generateResume, previewGitHubRepos } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-hooks";
import { toast } from "sonner";
import { Loader2, Sparkles, Download, Github, GitFork, Star } from "lucide-react";
import {
  ModernTemplate, ProfessionalTemplate, MinimalistTemplate, CreativeTemplate, CompactTemplate,
  TemplateSelector, ResumeData
} from "@/components/ResumeTemplates";
import { usePersistedState } from "@/lib/use-persisted-state";

export const Route = createFileRoute("/_authenticated/resume-builder")({ component: ResumeBuilder });

function ResumeBuilder() {
  const { user } = useAuth();
  const gen = useServerFn(generateResume);
  const githubPreviewFn = useServerFn(previewGitHubRepos);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [githubPreviewLoading, setGithubPreviewLoading] = useState(false);
  const [githubPreview, setGithubPreview] = useState<{
    found: boolean;
    username?: string;
    repoCount: number;
    skippedForks: number;
    chosenRepos: Array<{ name: string; description: string; language: string; stars: number; url: string }>;
  } | null>(null);
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

  const loadGitHubPreview = async () => {
    const url = f.githubUrl.trim();
    if (!url) {
      setGithubPreview(null);
      return;
    }
    setGithubPreviewLoading(true);
    try {
      const preview = await githubPreviewFn({ data: { githubUrl: url } });
      setGithubPreview(preview);
      if (!preview.found) toast.error("Could not read that GitHub profile. Check the URL and try again.");
      else toast.success(`Loaded ${preview.repoCount} repos from GitHub`);
    } catch (err) {
      setGithubPreview(null);
      toast.error(err instanceof Error ? err.message : "Could not load GitHub repos");
    } finally {
      setGithubPreviewLoading(false);
    }
  };

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
        <label className="block">
          <span className="text-xs text-muted-foreground">GitHub URL (auto-fetched)</span>
          <div className="mt-1 flex gap-2">
            <input value={f.githubUrl} onChange={(e) => setF({ ...f, githubUrl: e.target.value })} placeholder="https://github.com/username"
              className="w-full rounded-xl bg-surface-2 px-3 py-2.5 text-sm border border-border focus:border-primary outline-none" />
            <button type="button" onClick={loadGitHubPreview} disabled={githubPreviewLoading || !f.githubUrl.trim()}
              className="shrink-0 rounded-xl bg-surface-2 px-4 py-2.5 text-sm font-semibold border border-border hover:border-primary/50 disabled:opacity-50">
              {githubPreviewLoading ? "Checking…" : "Import repos"}
            </button>
          </div>
        </label>
        {inp("linkedinUrl", "LinkedIn URL")}
        <div className="sm:col-span-2">{inp("portfolioUrl", "Portfolio URL")}</div>

        {githubPreview && (
          <div className="sm:col-span-2 rounded-2xl border border-border bg-surface-2 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">GitHub repos imported</p>
                <h2 className="mt-1 flex items-center gap-2 text-lg font-bold">
                  <Github className="h-4 w-4 text-primary" />
                  {githubPreview.found ? `@${githubPreview.username}` : "No profile found"}
                </h2>
              </div>
              {githubPreview.found && (
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-primary/15 px-3 py-1.5 text-primary">{githubPreview.repoCount} repos found</span>
                  <span className="rounded-full bg-foreground/5 px-3 py-1.5 text-foreground flex items-center gap-1"><GitFork className="h-3.5 w-3.5" />{githubPreview.skippedForks} forks skipped</span>
                  <span className="rounded-full bg-foreground/5 px-3 py-1.5 text-foreground">Top {githubPreview.chosenRepos.length} chosen for projects</span>
                </div>
              )}
            </div>

            {githubPreview.found && githubPreview.chosenRepos.length > 0 && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {githubPreview.chosenRepos.map((repo) => (
                  <a key={repo.url || repo.name} href={repo.url} target="_blank" rel="noreferrer" className="rounded-xl border border-border bg-background/50 p-3 hover:border-primary/40 transition">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-sm text-foreground">{repo.name}</p>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Star className="h-3.5 w-3.5" />{repo.stars}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-3">{repo.description || "No description provided on GitHub."}</p>
                    {repo.language && <p className="mt-2 text-[11px] font-medium text-primary">{repo.language}</p>}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

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
