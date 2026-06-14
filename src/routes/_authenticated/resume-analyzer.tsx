import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { analyzeResume } from "@/lib/ai.functions";
import { toast } from "sonner";
import { Loader2, Search, Check, X, Upload, FileText, Copy } from "lucide-react";
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
  const [fileName, setFileName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setExtracting(true);
    setFileName(file.name);
    setResumeText("");
    try {
      const text = await extractTextFromFile(file);
      if (!text || text.trim().length < 20) {
        toast.error("Couldn't read enough text. Try a different file or paste manually below.");
        setResumeText("");
      } else {
        setResumeText(text);
        toast.success(`Extracted ${text.length.toLocaleString()} characters from ${file.name}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to extract text");
      setFileName("");
    } finally {
      setExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files?.[0]; if (file) handleFile(file);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeText || resumeText.trim().length < 50) { toast.error("Please upload your resume first."); return; }
    if (!jobTitle.trim()) { toast.error("Please enter the job title."); return; }
    if (jobDescription.trim().length < 20) { toast.error("Please paste a longer job description (at least 20 characters)."); return; }
    setLoading(true); setResult(null);
    try {
      const r = await fn({ data: { resumeText, jobTitle, jobDescription } });
      setResult(r as Result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally { setLoading(false); }
  };

  const score10 = result ? Math.round((result.eligibility.score / 10) * 10) / 10 : 0;
  const verdictColor = (v: string) =>
    v?.toLowerCase().includes("strong") ? "text-primary" :
    v?.toLowerCase().includes("not") ? "text-destructive" : "text-amber-400";

  const copy = (txt: string) => { navigator.clipboard.writeText(txt); toast.success("Copied"); };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="display text-3xl font-bold flex items-center gap-2"><Search className="h-7 w-7 text-primary" />Resume Analyzer</h1>
      <p className="text-sm text-muted-foreground mt-1">Upload your resume as a PDF or DOCX. We extract the text, score it out of 10, and give copy-paste improvements.</p>

      <form onSubmit={submit} className="mt-6 space-y-5">
        {/* BIG upload zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`glass rounded-2xl border-2 border-dashed cursor-pointer transition-all p-10 text-center
            ${dragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50"}`}
        >
          <input type="file" ref={fileInputRef} accept=".pdf,.docx,.txt"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            className="hidden" />
          <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/15 flex items-center justify-center mb-4">
            {extracting ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <Upload className="h-8 w-8 text-primary" />}
          </div>
          {extracting ? (
            <p className="text-base font-semibold">Extracting text from {fileName}…</p>
          ) : resumeText ? (
            <>
              <p className="text-base font-semibold text-primary flex items-center justify-center gap-2"><FileText className="h-4 w-4" />{fileName}</p>
              <p className="mt-1 text-xs text-muted-foreground">{resumeText.length.toLocaleString()} characters extracted — click to replace</p>
            </>
          ) : (
            <>
              <p className="text-lg font-bold">Drop your resume here or click to browse</p>
              <p className="mt-1 text-sm text-muted-foreground">Supports PDF, DOCX, and TXT — we'll pull the text automatically</p>
            </>
          )}
        </div>

        <div className="glass rounded-2xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Extracted resume text</span>
            <span className="text-[10px] text-muted-foreground">{resumeText.length.toLocaleString()} chars — edit or paste manually if extraction is incomplete</span>
          </div>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            rows={10}
            placeholder="Your extracted resume text will appear here. If your PDF is a scanned image, paste your resume text manually."
            className="w-full rounded-xl bg-surface-2 px-3 py-2.5 text-sm border border-border focus:border-primary outline-none font-mono"
          />
        </div>

        <div className="glass rounded-2xl p-6 space-y-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Target Job</span>
          <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Job title (e.g. Full Stack Developer)" required
            className="w-full rounded-xl bg-surface-2 px-3 py-2.5 text-sm border border-border focus:border-primary outline-none" />
          <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={6} placeholder="Paste the full job description / requirements" required
            className="w-full rounded-xl bg-surface-2 px-3 py-2.5 text-sm border border-border focus:border-primary outline-none" />
        </div>

        <div className="flex justify-end">
          <button disabled={loading || extracting || !resumeText} className="rounded-xl bg-primary px-8 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-primary/20">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}Analyze Resume
          </button>
        </div>
      </form>

      {result && (
        <div className="mt-8 space-y-6">
          <div className="glass rounded-2xl p-6 border-l-4 border-primary">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Verdict</p>
                <h2 className={`display text-3xl font-bold mt-1 ${verdictColor(result.eligibility.verdict)}`}>{result.eligibility.verdict}</h2>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Score</p>
                <p className="display text-6xl font-black text-primary">{score10}<span className="text-2xl text-muted-foreground">/10</span></p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{result.eligibility.reasoning}</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="glass rounded-2xl p-6">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2 uppercase tracking-wider"><Check className="h-4 w-4 text-primary" />Matched skills</h3>
              <div className="flex flex-wrap gap-2">{result.matchedSkills.map((s) => <span key={s} className="rounded-lg bg-primary/10 text-primary px-3 py-1.5 text-xs font-medium">{s}</span>)}</div>
            </div>
            <div className="glass rounded-2xl p-6">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2 uppercase tracking-wider"><X className="h-4 w-4 text-destructive" />Missing skills</h3>
              <div className="flex flex-wrap gap-2">{result.missingSkills.map((s) => <span key={s} className="rounded-lg bg-destructive/10 text-destructive px-3 py-1.5 text-xs font-medium">{s}</span>)}</div>
            </div>
          </div>

          <div className="glass rounded-2xl p-8">
            <h3 className="display text-xl font-bold mb-6 flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Copy-paste improvements</h3>
            <div className="space-y-5">
              {result.resumeChanges.map((c, i) => (
                <div key={i} className="bg-surface-2 rounded-xl p-5 border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{c.section}</p>
                    <button type="button" onClick={() => copy(c.suggested)} className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline">
                      <Copy className="h-3 w-3" /> Copy
                    </button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><span className="text-[10px] font-bold uppercase text-muted-foreground">Current</span><p className="text-sm mt-1 text-muted-foreground italic">"{c.current}"</p></div>
                    <div><span className="text-[10px] font-bold uppercase text-primary">Suggested</span><p className="text-sm mt-1 font-medium text-foreground">{c.suggested}</p></div>
                  </div>
                  <p className="mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground"><span className="font-bold text-foreground">Why:</span> {c.why}</p>
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
