import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { analyzeResume } from "@/lib/ai.functions";
import { toast } from "sonner";
import { Loader2, Search, Check, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/resume-analyzer")({ component: Analyzer });

type Result = {
  eligibility: { verdict: string; score: number; reasoning: string };
  matchedSkills: string[]; missingSkills: string[];
  strengths: string[]; weaknesses: string[];
  resumeChanges: Array<{ section: string; current: string; suggested: string; why: string }>;
  overallFeedback: string;
};

function Analyzer() {
  const fn = useServerFn(analyzeResume);
  const [loading, setLoading] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setResult(null);
    try {
      const r = await fn({ data: { resumeText, jobTitle, jobDescription } });
      setResult(r as Result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally { setLoading(false); }
  };

  const verdictColor = (v: string) =>
    v?.toLowerCase().includes("strong") ? "text-primary" :
    v?.toLowerCase().includes("not") ? "text-destructive" : "text-amber-400";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="display text-3xl font-bold flex items-center gap-2"><Search className="h-7 w-7 text-primary" />Resume Analyzer</h1>
      <p className="text-sm text-muted-foreground mt-1">Paste your resume and the posting. Get eligibility verdict + targeted edits.</p>

      <form onSubmit={submit} className="mt-6 glass rounded-2xl p-6 space-y-3">
        <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Job title (e.g. Full Stack Developer)" required
          className="w-full rounded-xl bg-surface-2 px-3 py-2.5 text-sm border border-border focus:border-primary outline-none" />
        <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={5} placeholder="Paste the full job description / requirements" required
          className="w-full rounded-xl bg-surface-2 px-3 py-2.5 text-sm border border-border focus:border-primary outline-none" />
        <textarea value={resumeText} onChange={(e) => setResumeText(e.target.value)} rows={8} placeholder="Paste your resume (plain text)" required
          className="w-full rounded-xl bg-surface-2 px-3 py-2.5 text-sm border border-border focus:border-primary outline-none" />
        <button disabled={loading} className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60 flex items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}Analyze
        </button>
      </form>

      {result && (
        <div className="mt-6 space-y-4">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Eligibility</p>
                <h2 className={`display text-2xl font-bold mt-1 ${verdictColor(result.eligibility.verdict)}`}>{result.eligibility.verdict}</h2>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Match score</p>
                <p className="display text-4xl font-bold text-primary">{result.eligibility.score}<span className="text-base text-muted-foreground">/100</span></p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{result.eligibility.reasoning}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="glass rounded-2xl p-5">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Check className="h-4 w-4 text-primary" />Matched skills</h3>
              <div className="flex flex-wrap gap-1.5">{result.matchedSkills.map((s) => <span key={s} className="rounded-full bg-primary/15 text-primary px-2.5 py-1 text-xs">{s}</span>)}</div>
            </div>
            <div className="glass rounded-2xl p-5">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><X className="h-4 w-4 text-destructive" />Missing skills</h3>
              <div className="flex flex-wrap gap-1.5">{result.missingSkills.map((s) => <span key={s} className="rounded-full bg-destructive/15 text-destructive px-2.5 py-1 text-xs">{s}</span>)}</div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="display text-lg font-bold mb-3">Resume changes to make</h3>
            <div className="space-y-4">
              {result.resumeChanges.map((c, i) => (
                <div key={i} className="border-l-2 border-primary pl-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{c.section}</p>
                  <p className="text-sm mt-1"><span className="text-muted-foreground">Now:</span> {c.current}</p>
                  <p className="text-sm mt-1"><span className="text-primary font-medium">Suggested:</span> {c.suggested}</p>
                  <p className="text-xs text-muted-foreground mt-1 italic">{c.why}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="display text-lg font-bold mb-2">Overall feedback</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{result.overallFeedback}</p>
          </div>
        </div>
      )}
    </div>
  );
}
