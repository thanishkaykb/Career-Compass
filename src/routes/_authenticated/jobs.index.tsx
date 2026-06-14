import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, MapPin } from "lucide-react";
import { useAuth } from "@/lib/auth-hooks";

export const Route = createFileRoute("/_authenticated/jobs/")({ component: JobsIndex });

function JobsIndex() {
  const { role } = useAuth();
  const { data: jobs, isLoading } = useQuery({
    queryKey: ["jobs-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("jobs").select("*").eq("status", "open").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="display text-3xl font-bold flex items-center gap-2"><Briefcase className="h-7 w-7 text-primary" />Job Board</h1>
      <p className="text-sm text-muted-foreground mt-1">Use Job Details to review the role, or Apply Now to open the application form.</p>

      <div className="mt-6 space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {jobs?.length === 0 && <p className="text-sm text-muted-foreground">No open jobs yet.</p>}
        {jobs?.map((j) => (
          <div key={j.id} className="glass rounded-2xl p-5 transition hover:bg-surface-2">
            <div className="flex justify-between items-start gap-3 flex-wrap">
              <div>
                <h3 className="display text-lg font-bold">{j.title}</h3>
                <p className="text-sm text-muted-foreground">{j.company}</p>
              </div>
              {j.employment_type && <span className="text-xs rounded-full bg-primary/15 text-primary px-2.5 py-1">{j.employment_type}</span>}
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {j.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{j.location}</span>}
              {j.salary_range && <span>{j.salary_range}</span>}
            </div>
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{j.description}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/jobs/$jobId"
                params={{ jobId: j.id }}
                className="inline-flex items-center justify-center rounded-xl border border-border bg-surface-2 px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary/40 hover:text-primary"
              >
                Job Details
              </Link>
              {role !== "recruiter" && (
                <Link
                  to="/jobs/$jobId"
                  params={{ jobId: j.id }}
                  search={{ apply: true }}
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  Apply Now
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
