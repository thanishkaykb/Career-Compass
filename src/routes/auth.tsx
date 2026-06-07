import { createFileRoute, useNavigate, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type Role } from "@/lib/auth-hooks";
import { toast } from "sonner";
import { Mail, Loader2, ArrowLeft, User, Building2 } from "lucide-react";
import { z } from "zod";
import { Logo } from "@/components/Logo";

const searchSchema = z.object({
  role: z.enum(["job_seeker", "recruiter"]).optional(),
});

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Career Compass" }] }),
  validateSearch: searchSchema,
  component: AuthPage,
});

function AuthPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const role: Role = search.role ?? "job_seeker";
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  useEffect(() => { if (!authLoading && user) navigate({ to: "/dashboard" }); }, [user, authLoading, navigate]);

  const isRecruiter = role === "recruiter";
  const accent = isRecruiter ? "from-fuchsia-700 via-pink-700 to-orange-600" : "from-emerald-700 via-teal-700 to-cyan-700";
  const Icon = isRecruiter ? Building2 : User;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        if (!fullName.trim()) { toast.error("Please enter your full name"); setLoading(false); return; }
        if (isRecruiter && !companyName.trim()) { toast.error("Company name is required"); setLoading(false); return; }
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            data: {
              full_name: fullName.trim(),
              role,
              company_name: isRecruiter ? companyName.trim() : null,
              phone: phone.trim() || null,
            },
            emailRedirectTo: `${window.location.origin}/auth?role=${role}`,
          },
        });
        if (error) throw error;
        setSentTo(email);
        toast.success("Check your email for a verification link");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.toLowerCase().includes("email not confirmed")) {
            toast.error("Please verify your email first. Check your inbox & spam folder.");
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

  const resendVerification = async () => {
    if (!sentTo) return;
    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: sentTo,
      options: { emailRedirectTo: `${window.location.origin}/auth?role=${role}` },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Verification email resent");
  };

  if (sentTo) {
    return (
      <div className="min-h-screen grid-bg flex items-center justify-center px-4">
        <div className="glass max-w-md w-full rounded-2xl p-8 text-center">
          <button onClick={() => { setSentTo(null); }} className="absolute left-6 top-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Mail className="h-7 w-7" />
          </div>
          <h2 className="display text-2xl font-bold">Verify your email</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            We sent a verification link to <span className="text-foreground font-medium">{sentTo}</span>. Click it to activate your account, then come back to sign in.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Didn't get it? Check spam, or resend below.</p>
          <button onClick={resendVerification} disabled={loading} className="mt-6 w-full rounded-xl border border-border bg-surface-2 py-3 text-sm font-semibold hover:bg-surface-1 disabled:opacity-60">
            {loading ? "Sending…" : "Resend email"}
          </button>
          <button onClick={() => { setSentTo(null); setMode("signin"); }} className="mt-2 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground">
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground display font-bold">C</div>
            <span className="display text-sm font-bold">Career Compass</span>
          </Link>
        </div>

        <div className="glass rounded-2xl p-7">
          <div className={`-mx-7 -mt-7 mb-6 rounded-t-2xl bg-gradient-to-br ${accent} px-7 py-5 text-white shadow-lg`}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/30 ring-1 ring-white/30">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]">{isRecruiter ? "Recruiter / HR" : "Job Seeker"}</p>
                <h1 className="display text-xl font-bold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">{mode === "signup" ? "Create your account" : "Welcome back"}</h1>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <>
                <input type="text" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required
                  className="w-full rounded-xl bg-surface-2 px-4 py-3 text-sm outline-none border border-border focus:border-primary" />
                {isRecruiter && (
                  <input type="text" placeholder="Company name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required
                    className="w-full rounded-xl bg-surface-2 px-4 py-3 text-sm outline-none border border-border focus:border-primary" />
                )}
                <input type="tel" placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl bg-surface-2 px-4 py-3 text-sm outline-none border border-border focus:border-primary" />
              </>
            )}
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full rounded-xl bg-surface-2 px-4 py-3 text-sm outline-none border border-border focus:border-primary" />
            <input type="password" placeholder="Password (min 8 chars)" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full rounded-xl bg-surface-2 px-4 py-3 text-sm outline-none border border-border focus:border-primary" />
            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
            <button onClick={() => setMode(mode === "signup" ? "signin" : "signup")} className="text-primary font-medium">
              {mode === "signup" ? "Sign in" : "Create one"}
            </button>
          </p>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Not a {isRecruiter ? "recruiter" : "job seeker"}?{" "}
            <Link to="/auth" search={{ role: isRecruiter ? "job_seeker" : "recruiter" }} className="text-primary">
              Switch to {isRecruiter ? "Job Seeker" : "Recruiter"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
