import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Sparkles, FileText, Search, Briefcase, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-hooks";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ResumeAI — Build, Analyze, and Land Your Next Job" },
      { name: "description", content: "AI-powered resume builder, resume analyzer, and job board. Smarter career tools for seekers and recruiters." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen grid-bg">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground display font-bold">R</div>
          <span className="display text-lg font-bold">ResumeAI</span>
        </div>
        <Link to="/auth" className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Sign in</Link>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface-1 px-3 py-1.5 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Career intelligence, powered by AI
        </div>
        <h1 className="display text-5xl font-bold leading-[1.05] sm:text-7xl">
          Land the job <br /><span className="text-primary">you actually want.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Build resumes from your real experience. Analyze them against any posting. Apply in one click. Built for seekers and recruiters.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link to="/auth" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">
            Get started free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/auth" className="rounded-full border border-border bg-surface-1 px-6 py-3 text-sm font-medium hover:bg-surface-2">I'm a recruiter</Link>
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
    </div>
  );
}
