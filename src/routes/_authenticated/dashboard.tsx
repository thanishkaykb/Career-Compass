import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-hooks";
import { FileText, Search, Briefcase, Building2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user, role } = useAuth();
  const seekerCards = [
    { to: "/resume-builder", t: "Build my resume", d: "AI-generated from your real info", i: FileText },
    { to: "/resume-analyzer", t: "Analyze my resume", d: "Match it to any job posting", i: Search },
    { to: "/jobs", t: "Browse jobs", d: "Apply with one click", i: Briefcase },
  ];
  const recruiterCards = [
    { to: "/recruiter", t: "Post & manage jobs", d: "Create, edit, delete listings", i: Building2 },
    { to: "/jobs", t: "Public job board", d: "See what's live", i: Briefcase },
  ];
  const cards = role === "recruiter" ? recruiterCards : seekerCards;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="display text-3xl font-bold sm:text-4xl">Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}.</h1>
      <p className="mt-2 text-sm text-muted-foreground">{role === "recruiter" ? "Manage your postings and applicants." : "Build, analyze, apply — all in one place."}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ to, t, d, i: Icon }) => (
          <Link key={to} to={to} className="glass rounded-2xl p-6 hover:bg-surface-2 transition">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary"><Icon className="h-5 w-5" /></div>
            <h3 className="display text-lg font-bold">{t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
