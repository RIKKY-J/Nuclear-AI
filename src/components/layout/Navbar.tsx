import { Atom, History, LogIn, LogOut, User } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import ThemeToggle from "@/components/common/ThemeToggle";
import { getCurrentUserFn, logoutFn } from "@/lib/auth.functions";

export default function Navbar() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getCurrentUserFn().then(setUser).catch(console.error);
  }, []);

  const handleLogout = async () => {
    try {
      await logoutFn();
      setUser(null);
      toast.success("Logged out successfully");
      navigate({ to: "/" });
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-8 lg:px-12">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Atom className="h-5 w-5 animate-pulse-ring" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg font-semibold tracking-tight">Nuclear AI</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Summarizer
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/history"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel/60 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
            activeProps={{ className: "!text-primary !border-primary/40" }}
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-border/60 bg-panel/30 px-3 py-2 text-sm font-medium text-muted-foreground">
                <User className="h-3.5 w-3.5 text-primary" />
                <span className="max-w-[120px] truncate">{user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-panel/60 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-semibold hover:brightness-110 transition-all shadow-sm"
              activeProps={{ className: "hidden" }}
            >
              <LogIn className="h-4 w-4" />
              <span>Sign In</span>
            </Link>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

