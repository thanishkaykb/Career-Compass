import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, KeyRound } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — Career Compass" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase recovery link sets a session via the URL hash; just confirm we have one.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      else {
        // Wait briefly — recovery hash is processed by the client.
        const t = setTimeout(() => supabase.auth.getSession().then(({ data: d }) => {
          if (d.session) setReady(true);
          else toast.error("This reset link is invalid or expired. Request a new one.");
        }), 600);
        return () => clearTimeout(t);
      }
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (password !== confirm) { toast.error("Passwords do not match"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated. You are signed in.");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center px-4">
      <div className="glass max-w-md w-full rounded-2xl p-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <KeyRound className="h-7 w-7" />
        </div>
        <h1 className="display text-2xl font-bold text-center">Set a new password</h1>
        <p className="mt-2 text-sm text-muted-foreground text-center">Choose a new password for your Career Compass account.</p>

        {!ready ? (
          <div className="mt-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-3">
            <input type="password" placeholder="New password (min 8 chars)" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full rounded-xl bg-surface-2 px-4 py-3 text-sm border border-border focus:border-primary outline-none" />
            <input type="password" placeholder="Confirm new password" minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} required
              className="w-full rounded-xl bg-surface-2 px-4 py-3 text-sm border border-border focus:border-primary outline-none" />
            <button disabled={loading} className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}Update password
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link to="/auth" className="text-primary">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
