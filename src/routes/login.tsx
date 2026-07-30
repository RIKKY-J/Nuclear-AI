import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Mail, ArrowRight, Loader2, Sparkles, Key } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/sonner";
import { loginWithTokenFn, sendMagicLinkFn } from "@/lib/auth.functions";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  validateSearch: (search: Record<string, unknown>): { token?: string } => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
});

function LoginPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  // Auto-verify if token is in search params
  useEffect(() => {
    if (token) {
      const verifyToken = async () => {
        setIsVerifying(true);
        try {
          await loginWithTokenFn({ data: { token } });
          toast.success("Logged in successfully!");
          // Navigate to home after a brief delay so they see the success state
          setTimeout(() => {
            navigate({ to: "/" });
          }, 1500);
        } catch (err) {
          console.error(err);
          toast.error(err instanceof Error ? err.message : "Failed to verify token.");
          setIsVerifying(false);
        }
      };
      verifyToken();
    }
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      await sendMagicLinkFn({ data: { email: email.trim() } });
      setSentTo(email.toLowerCase().trim());
      toast.success("Magic link sent!", {
        description: "Check your email (or server terminal logs) for the link.",
      });
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to send magic link.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="relative flex-1 flex items-center justify-center px-4 py-16">
        <div className="absolute inset-0 hero-grid opacity-50 pointer-events-none" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[350px] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />

        <div className="relative w-full max-w-md rounded-2xl border border-border bg-panel/40 p-6 sm:p-8 backdrop-blur shadow-xl">
          <AnimatePresence mode="wait">
            {isVerifying ? (
              <motion.div
                key="verifying"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center text-center py-8 space-y-4"
              >
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
                <h2 className="font-display text-2xl font-bold">Verifying login…</h2>
                <p className="text-sm text-muted-foreground">
                  Validating your token and logging you in.
                </p>
              </motion.div>
            ) : sentTo ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center space-y-6 py-4"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                  <Mail className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h2 className="font-display text-2xl font-bold">Check your inbox</h2>
                  <p className="text-sm text-muted-foreground">
                    We've sent a magic link to <strong className="text-foreground">{sentTo}</strong>
                    .
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-panel/60 border border-border text-left text-xs space-y-2">
                  <div className="flex gap-2 items-start text-amber-500">
                    <Key className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="font-semibold">Local Development Notice</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Check your **IDE/Terminal console output** to click the generated magic link
                    directly!
                  </p>
                </div>
                <button
                  onClick={() => setSentTo(null)}
                  className="text-sm text-primary hover:underline"
                >
                  Back to Sign In
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-panel px-2.5 py-0.5 text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                    Nuclear Accounts
                  </div>
                  <h2 className="font-display text-3xl font-bold tracking-tight">Welcome Back</h2>
                  <p className="text-sm text-muted-foreground">
                    Sign in to sync your history and share summaries.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        id="email"
                        type="email"
                        required
                        disabled={isLoading}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-panel/60 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !email}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 font-semibold glow-primary hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Send Magic Link
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
      <Toaster richColors position="top-right" />
    </div>
  );
}
