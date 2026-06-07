import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type Role } from "@/lib/auth-hooks";
import { toast } from "sonner";
import { Mail, Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — ResumeAI" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<Role>("job_seeker");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  useEffect(() => { if (!authLoading && user) navigate({ to: "/dashboard" }); }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        if (!fullName.trim()) { toast.error("Please enter your full name"); setLoading(false); return; }
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            data: { full_name: fullName.trim(), role },
            emailRedirectTo: `${window.location.origin}/auth`,
          },
        });
        if (error) throw error;
        setSentTo(email);
        toast.success("Check your email for a verification link");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.toLowerCase().includes("email not confirmed")) {
            toast.error("Please verify your email first. Check your inbox.");
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success("Welcome back");
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (sentTo) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center px-4">
        <div className="glass max-w-md w-full rounded-2xl p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Mail className="h-7 w-7" />
          </div>
          <h2 className="display text-2xl font-bold">Verify your email</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            We sent a verification link to <span className="text-foreground font-medium">{sentTo}</span>. Click it to activate your account, then come back to sign in.
          </p>
          <button onClick={() => { setSentTo(null); setMode("signin"); }} className="mt-6 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground">
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground display font-bold">R</div>
          <span className="display text-lg font-bold">ResumeAI</span>
        </Link>
        <div className="glass rounded-2xl p-7">
          <h1 className="display text-2xl font-bold">{mode === "signup" ? "Create your account" : "Welcome back"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signup" ? "Verify your email after sign-up to start." : "Sign in to continue."}
          </p>

          {mode === "signup" && (
            <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-surface-2 p-1">
              {(["job_seeker", "recruiter"] as Role[]).map((r) => (
                <button key={r} type="button" onClick={() => setRole(r)}
                  className={`rounded-lg py-2 text-xs font-medium transition ${role === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {r === "job_seeker" ? "Job seeker" : "Recruiter / HR"}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-3">
            {mode === "signup" && (
              <input type="text" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required
                className="w-full rounded-xl bg-surface-2 px-4 py-3 text-sm outline-none border border-border focus:border-primary" />
            )}
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full rounded-xl bg-surface-2 px-4 py-3 text-sm outline-none border border-border focus:border-primary" />
            <input type="password" placeholder="Password (min 6)" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full rounded-xl bg-surface-2 px-4 py-3 text-sm outline-none border border-border focus:border-primary" />
            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signup" ? "Already have an account?" : "New to ResumeAI?"}{" "}
            <button onClick={() => setMode(mode === "signup" ? "signin" : "signup")} className="text-primary font-medium">
              {mode === "signup" ? "Sign in" : "Create one"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
