import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Loader2, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const LoginPage = () => {
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [signingIn, setSigningIn] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        toast({ title: "Account created", description: "You're now signed in." });
      } else {
        await signInWithEmail(email, password);
      }
    } catch (error: any) {
      toast({
        title: isSignUp ? "Sign-up failed" : "Sign-in failed",
        description: error?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSigningIn(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      toast({
        title: "Sign-in failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setSigningIn(false);
    }
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      // Try signing in first; if user doesn't exist, sign up then sign in
      try {
        await signInWithEmail("demo@retrofly.app", "demodemo123");
      } catch {
        await signUpWithEmail("demo@retrofly.app", "demodemo123");
        await signInWithEmail("demo@retrofly.app", "demodemo123");
      }
      // Seed demo data (fire-and-forget)
      supabase.functions.invoke("seed-demo-data").catch(() => {});
    } catch (error: any) {
      toast({
        title: "Demo login failed",
        description: error?.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setDemoLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        className="min-h-screen flex items-center justify-center bg-background"
      >
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">Loading sign in…</span>
      </div>
    );
  }

  return (
    <main
      aria-labelledby="login-heading"
      className="relative min-h-screen w-full bg-background flex items-center justify-center px-4 overflow-hidden"
    >
      <SEO
        title={isSignUp ? "Create your account" : "Sign in"}
        description={
          isSignUp
            ? "Create a Retrofly account to run better retros, async."
            : "Sign in to Retrofly to run better retros, async."
        }
        path="/login"
      />
      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full space-y-8">
        {/* Wordmark */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-1.5">
            <Heart className="h-5 w-5 text-foreground fill-foreground" aria-hidden="true" />
            <h1 id="login-heading" className="text-4xl font-semibold tracking-[-0.02em] text-foreground">
              Retrofly
            </h1>
          </div>
        </div>

        {/* Sign-in card */}
        <div className="w-full glass-card rounded-lg p-8 space-y-5 relative">
          <p className="text-sm text-muted-foreground">
            {isSignUp ? "Create an account to get started" : "Sign in to your account"}
          </p>

          {/* Email form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={isSignUp ? "new-password" : "current-password"}
            />
            <Button
              type="submit"
              disabled={signingIn}
              className="w-full h-11 font-medium"
            >
              {signingIn ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isSignUp ? (
                "Sign up"
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          {/* Toggle sign-up / sign-in */}
          <p className="text-sm text-muted-foreground">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-foreground font-medium hover:underline underline-offset-2"
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>

          {/* Separator */}
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>

          {/* Google */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            size="lg"
            variant="outline"
            className="w-full gap-3 h-11 text-base font-medium border-border hover:bg-secondary text-foreground transition-all"
          >
            <GoogleIcon />
            Continue with Google
          </Button>

          {/* Demo login */}
          <Button
            onClick={handleDemoLogin}
            disabled={demoLoading}
            variant="ghost"
            className="w-full h-10 text-sm text-muted-foreground hover:text-foreground"
          >
            {demoLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Try demo account
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          By signing in, you agree to our terms of service
        </p>
      </div>
    </main>
  );
};

export default LoginPage;
