import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { analyzeResume } from "@/lib/ai.functions";
import { toast } from "sonner";
import { Loader2, Search, Check, X, Upload, FileText } from "lucide-react";
import { extractTextFromFile } from "@/lib/file-parser";

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
  const [extracting, setExtracting] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtracting(true);
    try {
      const text = await extractTextFromFile(file);
      setResumeText(text);
      toast.success(`Extracted text from ${file.name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to extract text");
    } finally {
      setExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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
      <p className="text-sm text-muted-foreground mt-1">Upload your resume (PDF/DOCX) or paste the text. Get an eligibility verdict + targeted edits.</p>

      <form onSubmit={submit} className="mt-6 glass rounded-2xl p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Job Details</span>
              <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Job title (e.g. Full Stack Developer)" required
                className="mt-1 w-full rounded-xl bg-surface-2 px-3 py-2.5 text-sm border border-border focus:border-primary outline-none" />
            </label>
            <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={10} placeholder="Paste the full job description / requirements" required
              className="w-full rounded-xl bg-surface-2 px-3 py-2.5 text-sm border border-border focus:border-primary outline-none" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Resume</span>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={extracting}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                {extracting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                Upload File
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".pdf,.docx,.txt" 
                className="hidden" 
              />
            </div>
            
            <textarea value={resumeText} onChange={(e) => setResumeText(e.target.value)} rows={12} placeholder="Paste your resume or upload a file" required
              className="w-full rounded-xl bg-surface-2 px-3 py-2.5 text-sm border border-border focus:border-primary outline-none" />
          </div>
        </div>

        <div className="flex justify-end">
          <button disabled={loading || extracting} className="rounded-xl bg-primary px-8 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60 flex items-center gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}Analyze Resume
          </button>
        </div>
      </form>

      {result && (
        <div className="mt-8 space-y-6">
          <div className="glass rounded-2xl p-6 border-l-4 border-primary">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Eligibility Verdict</p>
                <h2 className={`display text-3xl font-bold mt-1 ${verdictColor(result.eligibility.verdict)}`}>{result.eligibility.verdict}</h2>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Match score</p>
                <p className="display text-5xl font-black text-primary">{result.eligibility.score}<span className="text-xl text-muted-foreground">/100</span></p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{result.eligibility.reasoning}</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="glass rounded-2xl p-6 border-t-2 border-primary/20">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2 uppercase tracking-wider"><Check className="h-4 w-4 text-primary" />Matched skills</h3>
              <div className="flex flex-wrap gap-2">{result.matchedSkills.map((s) => <span key={s} className="rounded-lg bg-primary/10 text-primary px-3 py-1.5 text-xs font-medium border border-primary/10">{s}</span>)}</div>
            </div>
            <div className="glass rounded-2xl p-6 border-t-2 border-destructive/20">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2 uppercase tracking-wider"><X className="h-4 w-4 text-destructive" />Missing skills</h3>
              <div className="flex flex-wrap gap-2">{result.missingSkills.map((s) => <span key={s} className="rounded-lg bg-destructive/10 text-destructive px-3 py-1.5 text-xs font-medium border border-destructive/10">{s}</span>)}</div>
            </div>
          </div>

          <div className="glass rounded-2xl p-8">
            <h3 className="display text-xl font-bold mb-6 flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Strategic Enhancements</h3>
            <div className="space-y-6">
              {result.resumeChanges.map((c, i) => (
                <div key={i} className="group relative bg-surface-2 rounded-xl p-5 border border-border transition-all hover:border-primary/30">
                  <div className="absolute top-5 left-0 w-1 h-6 bg-primary rounded-r-full" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">{c.section}</p>
                  <div className="grid gap-4 sm:grid-cols-2 mt-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">Current</span>
                      <p className="text-sm mt-1 text-muted-foreground italic">"{c.current}"</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-primary">Suggested</span>
                      <p className="text-sm mt-1 font-medium text-foreground leading-relaxed">{c.suggested}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground leading-relaxed"><span className="font-bold text-foreground">Why:</span> {c.why}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-8 bg-primary/5 border border-primary/10">
            <h3 className="display text-xl font-bold mb-4">Final Coaching</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{result.overallFeedback}</p>
          </div>
        </div>
      )}
    </div>
  );
}
