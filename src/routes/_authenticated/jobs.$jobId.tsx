import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-hooks";
import { toast } from "sonner";
import { CheckCircle2, MapPin, Loader2, Upload, FileText } from "lucide-react";
import { extractTextFromFile } from "@/lib/file-parser";
import { usePersistedState } from "@/lib/use-persisted-state";

export const Route = createFileRoute("/_authenticated/jobs/$jobId")({
  validateSearch: (search) => ({ apply: search.apply === true || search.apply === "true" || search.apply === "1" }),
  component: JobDetail,
});

function JobDetail() {
  const { jobId } = Route.useParams();
  const { apply: openApplyFromSearch } = Route.useSearch();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [showApply, setShowApply] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [resumeFileName, setResumeFileName] = useState("");
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumePath, setResumePath] = useState<string | null>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = usePersistedState(`apply-form-${jobId}`, { full_name: "", email: "", phone: "", cover_letter: "", resume_text: "" });

  const handleResumeFile = async (file: File) => {
    setExtracting(true); setUploadingResume(true); setResumeFileName(file.name);
    try {
      if (!user) throw new Error("Please sign in before uploading your resume.");
      const text = await extractTextFromFile(file);
      const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
      const objectPath = `${user.id}/${jobId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("candidate-resumes").upload(objectPath, file, {
        upsert: false,
        contentType: file.type || undefined,
      });
      if (uploadError) throw uploadError;
      setForm((f) => ({ ...f, resume_text: text }));
      setResumePath(objectPath);
      toast.success(`Resume extracted (${text.length.toLocaleString()} chars)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to read resume");
      setResumeFileName("");
      setResumePath(null);
    } finally { setExtracting(false); }
    setUploadingResume(false);
  };

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", jobId],
    queryFn: async () => {
      const { data, error } = await supabase.from("jobs").select("*").eq("id", jobId).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: existing, refetch } = useQuery({
    queryKey: ["application", jobId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("applications").select("id, status").eq("job_id", jobId).eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (user && !form.email) setForm((f) => ({ ...f, email: user.email || "" }));
    if (user) supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) setForm((f) => ({ ...f, full_name: f.full_name || data.full_name || "", phone: f.phone || data.phone || "" }));
    });
  }, [user, form.email]);

  useEffect(() => {
    if (openApplyFromSearch && role === "job_seeker" && !existing) {
      setShowApply(true);
    }
  }, [openApplyFromSearch, role, existing]);

  const apply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.full_name.trim() || !form.email.trim()) { toast.error("Please fill in your name and email."); return; }
    if (!resumePath && !form.resume_text.trim()) { toast.error("Please upload your resume before applying."); return; }
    setSubmitting(true);
    const { error } = await supabase.from("applications").insert({
      job_id: jobId, user_id: user.id,
      full_name: form.full_name, email: form.email, phone: form.phone,
      cover_letter: form.cover_letter,
      resume_content: form.resume_text ? { text: form.resume_text } : null,
      resume_file_name: resumeFileName || null,
      resume_path: resumePath,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Application submitted");
    try { window.localStorage.removeItem(`apply-form-${jobId}`); } catch { /* ignore */ }
    setForm({ full_name: "", email: "", phone: "", cover_letter: "", resume_text: "" });
    setResumeFileName("");
    setResumePath(null);
    setShowApply(false);
    refetch();
  };

  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!job) return <div className="p-8 text-center text-muted-foreground">Job not found.</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <button onClick={() => navigate({ to: "/jobs" })} className="text-xs text-muted-foreground mb-4">← Back to board</button>
      <div className="glass rounded-2xl p-6">
        <h1 className="display text-3xl font-bold">{job.title}</h1>
        <p className="text-muted-foreground mt-1">{job.company}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {job.location && <span className="flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1"><MapPin className="h-3 w-3" />{job.location}</span>}
          {job.employment_type && <span className="rounded-full bg-surface-2 px-2.5 py-1">{job.employment_type}</span>}
          {job.salary_range && <span className="rounded-full bg-surface-2 px-2.5 py-1">{job.salary_range}</span>}
        </div>

        <section className="mt-6"><h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Description</h2><p className="mt-2 text-sm whitespace-pre-line">{job.description}</p></section>
        {job.responsibilities && <section className="mt-4"><h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Responsibilities</h2><p className="mt-2 text-sm whitespace-pre-line">{job.responsibilities}</p></section>}
        {job.requirements && <section className="mt-4"><h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Requirements</h2><p className="mt-2 text-sm whitespace-pre-line">{job.requirements}</p></section>}
        {job.skills && job.skills.length > 0 && (
          <section className="mt-4">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Skills</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">{job.skills.map((s: string) => <span key={s} className="rounded-full bg-primary/15 text-primary px-2.5 py-1 text-xs">{s}</span>)}</div>
          </section>
        )}

        {role === "job_seeker" && (
          <div className="mt-6">
            {existing ? (
              <div className="rounded-xl bg-primary/10 border border-primary/30 p-4 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">You've applied for this role.</p>
                  <p className="text-xs text-muted-foreground mt-1">Status: <span className="text-foreground">{existing.status}</span>. Please wait for the recruiter to respond.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => setShowApply((value) => !value)} className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
                    {showApply ? "Hide application form" : "Apply Now"}
                  </button>
                  <button onClick={() => navigate({ to: "/applications" })} className="rounded-xl border border-border bg-surface-2 px-6 py-3 text-sm font-medium text-foreground">
                    View my applications
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">Your details and resume are submitted in the application form below.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showApply && role === "job_seeker" && !existing && (
        <form onSubmit={apply} className="mt-6 glass rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="display text-xl font-bold">Application Form</h2>
            <p className="mt-1 text-sm text-muted-foreground">Fill in your details, attach your resume, and submit your application for {job.title}.</p>
          </div>

          <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Full name" className="w-full rounded-xl bg-surface-2 px-3 py-2.5 text-sm border border-border" />
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="w-full rounded-xl bg-surface-2 px-3 py-2.5 text-sm border border-border" />
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="w-full rounded-xl bg-surface-2 px-3 py-2.5 text-sm border border-border" />
          <textarea value={form.cover_letter} onChange={(e) => setForm({ ...form, cover_letter: e.target.value })} rows={4} placeholder="Cover letter / why you?" className="w-full rounded-xl bg-surface-2 px-3 py-2.5 text-sm border border-border" />

          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Resume</span>
            <input type="file" ref={resumeInputRef} accept=".pdf,.docx,.txt" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleResumeFile(f); }} />
            <button type="button" onClick={() => resumeInputRef.current?.click()}
              className="mt-1 w-full rounded-2xl border-2 border-dashed border-border hover:border-primary/50 bg-surface-2 px-5 py-8 text-sm flex flex-col items-center justify-center gap-2 text-center">
              {extracting || uploadingResume ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
              {resumeFileName ? (
                <span className="flex items-center gap-1.5 text-primary font-medium"><FileText className="h-4 w-4" />{resumeFileName}</span>
              ) : (
                <>
                  <span className="font-semibold">Upload resume</span>
                  <span className="text-xs text-muted-foreground">PDF, DOCX, or TXT — we’ll extract the text and attach it to your application</span>
                </>
              )}
            </button>
            <textarea value={form.resume_text} onChange={(e) => setForm({ ...form, resume_text: e.target.value })} rows={3} placeholder="Extracted resume text appears here" className="mt-2 w-full rounded-xl bg-surface-2 px-3 py-2.5 text-sm border border-border" />
            {resumePath && <p className="mt-2 text-xs text-primary">Resume attached successfully and ready to submit.</p>}
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => setShowApply(false)} className="rounded-xl px-4 py-2 text-sm text-muted-foreground">Hide form</button>
            <button disabled={submitting || extracting || uploadingResume} className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">{submitting ? "Submitting…" : "Submit application"}</button>
          </div>
        </form>
      )}
    </div>
  );
}
