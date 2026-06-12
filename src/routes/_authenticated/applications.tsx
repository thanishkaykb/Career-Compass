import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-hooks";
import { Briefcase, Clock, CheckCircle2, XCircle, Star } from "lucide-react";

export const Route = createFileRoute("/_authenticated/applications")({ component: Applications });

const statusMeta: Record<string, { label: string; icon: typeof Clock; cls: string }> = {
  submitted: { label: "Pending recruiter response", icon: Clock, cls: "bg-amber-500/15 text-amber-400" },
  shortlisted: { label: "Shortlisted", icon: Star, cls: "bg-primary/15 text-primary" },
  hired: { label: "Hired 🎉", icon: CheckCircle2, cls: "bg-emerald-500/15 text-emerald-400" },
  rejected: { label: "Not selected", icon: XCircle, cls: "bg-destructive/15 text-destructive" },
};

function Applications() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["my-applications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id, status, created_at, job_id, jobs(title, company, location)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="display text-3xl font-bold flex items-center gap-2">
        <Briefcase className="h-7 w-7 text-primary" />
        My Applications
      </h1>
      <p className="text-sm text-muted-foreground mt-1">Track the status of every job you've applied to.</p>

      <div className="mt-6 space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {data?.length === 0 && (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-sm text-muted-foreground">You haven't applied to any jobs yet.</p>
            <Link to="/jobs" className="mt-3 inline-block rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Browse jobs</Link>
          </div>
        )}
        {data?.map((a) => {
          const meta = statusMeta[a.status] ?? statusMeta.submitted;
          const Icon = meta.icon;
          const job = a.jobs as { title?: string; company?: string; location?: string } | null;
          return (
            <Link key={a.id} to="/jobs/$jobId" params={{ jobId: a.job_id }} className="glass block rounded-2xl p-5 hover:bg-surface-2 transition">
              <div className="flex justify-between items-start gap-3 flex-wrap">
                <div className="min-w-0">
                  <h3 className="display text-lg font-bold truncate">{job?.title ?? "Job"}</h3>
                  <p className="text-sm text-muted-foreground truncate">{job?.company}{job?.location ? ` • ${job.location}` : ""}</p>
                  <p className="text-xs text-muted-foreground mt-1">Applied {new Date(a.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${meta.cls}`}>
                  <Icon className="h-3.5 w-3.5" />
                  {meta.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
