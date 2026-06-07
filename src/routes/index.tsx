import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, FileText, Search, Briefcase, ArrowRight, User, Building2, X } from "lucide-react";
import { useAuth } from "@/lib/auth-hooks";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Career Compass — Build, Analyze, and Land Your Next Job" },
      { name: "description", content: "AI-powered resume builder, resume analyzer, and job board." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [chooserOpen, setChooserOpen] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen grid-bg">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground display font-bold">C</div>
          <span className="display text-lg font-bold">Career Compass</span>
        </div>
        <button onClick={() => setChooserOpen(true)} className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Sign in</button>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface-1 px-3 py-1.5 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Career intelligence, powered by AI
        </div>
        <h1 className="display text-5xl font-bold leading-[1.05] sm:text-7xl">
          Land the job <br /><span className="text-primary">you actually want.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Build resumes from your real experience. Analyze them against any posting. Apply in one click.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <button onClick={() => setChooserOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">
            Get started <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-20 grid gap-4 sm:grid-cols-3">
          {[
            { i: FileText, t: "Resume Builder", d: "Auto-fill from your GitHub. Polish with AI." },
            { i: Search, t: "Resume Analyzer", d: "Match your resume to any posting. See gaps." },
            { i: Briefcase, t: "Job Board", d: "Apply with one click. Track every response." },
          ].map(({ i: Icon, t, d }) => (
            <div key={t} className="glass rounded-2xl p-6 text-left">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="display text-lg font-bold">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {chooserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => setChooserOpen(false)}>
          <div className="glass relative w-full max-w-lg rounded-2xl p-8" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setChooserOpen(false)} className="absolute right-4 top-4 rounded-full p-1.5 hover:bg-surface-2" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
            <h2 className="display text-2xl font-bold text-center">Who are you?</h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">Pick how you'll use Career Compass.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link to="/auth" search={{ role: "job_seeker" }} className="glass rounded-2xl p-5 text-left hover:border-primary border border-transparent transition">
                <User className="h-7 w-7 text-primary" />
                <h3 className="display mt-3 font-bold">Job Seeker</h3>
                <p className="mt-1 text-xs text-muted-foreground">Build resumes, apply to jobs, track responses.</p>
              </Link>
              <Link to="/auth" search={{ role: "recruiter" }} className="glass rounded-2xl p-5 text-left hover:border-primary border border-transparent transition">
                <Building2 className="h-7 w-7 text-primary" />
                <h3 className="display mt-3 font-bold">Recruiter / HR</h3>
                <p className="mt-1 text-xs text-muted-foreground">Post jobs, review applications, hire talent.</p>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
