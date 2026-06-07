import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, FileText, Search, Briefcase, Building2, LogOut, User } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-hooks";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";

const seekerNav = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/resume-builder", label: "Resume", icon: FileText },
  { to: "/resume-analyzer", label: "Analyze", icon: Search },
  { to: "/jobs", label: "Jobs", icon: Briefcase },
  { to: "/profile", label: "Profile", icon: User },
] as const;

const recruiterNav = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/recruiter", label: "My Jobs", icon: Building2 },
  { to: "/jobs", label: "Board", icon: Briefcase },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AppLayout({ children }: { children: ReactNode }) {
  const { role, user } = useAuth();
  const loc = useLocation();
  const navigate = useNavigate();
  const nav = role === "recruiter" ? recruiterNav : seekerNav;

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Desktop header */}
      <header className="hidden md:flex sticky top-0 z-40 glass border-b border-border h-16 items-center px-6 gap-6">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground display font-bold text-sm">R</div>
          <span className="display font-bold">Career Compass</span>
        </Link>
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground hidden lg:inline">{user?.email}</span>
        <button onClick={signOut} className="rounded-lg p-2 hover:bg-surface-2 text-muted-foreground" title="Sign out">
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      {/* Mobile top bar (minimal) */}
      <header className="md:hidden sticky top-0 z-40 glass border-b border-border h-14 flex items-center justify-between px-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground display font-bold text-sm">R</div>
          <span className="display font-bold">Career Compass</span>
        </Link>
        <button onClick={signOut} className="rounded-lg p-2 hover:bg-surface-2 text-muted-foreground">
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      <main className="flex-1 pb-24 md:pb-10">{children}</main>

      {/* Bottom nav — present on BOTH mobile and desktop per user request */}
      <nav className="fixed bottom-0 inset-x-0 z-40 glass border-t border-border">
        <div className="mx-auto max-w-2xl grid grid-cols-5 px-2 py-2" style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}>
          {nav.map(({ to, label, icon: Icon }) => {
            const active = loc.pathname === to || (to !== "/dashboard" && loc.pathname.startsWith(to));
            return (
              <Link key={to} to={to} className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                <Icon className={`h-5 w-5 ${active ? "text-primary" : ""}`} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
