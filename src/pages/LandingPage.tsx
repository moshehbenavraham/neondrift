import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import heroIllustration from "@/assets/hero-illustration.png";
import { Button } from "@/components/ui/button";
import { BlurFade } from "@/components/ui/blur-fade";
import SEO from "@/components/SEO";
import {
  ArrowRight,
  Heart,
  MessageSquare,
  Users,
  Brain,
  CheckCircle2,
  Layers,
  Zap,
} from "lucide-react";

const LandingPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  const [showNav, setShowNav] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowNav(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO path="/" />

      {/* Skip link for keyboard / screen-reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-md focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-background focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Skip to main content
      </a>

      {/* Nav visible on scroll */}
      <nav
        aria-label="Primary"
        className={`fixed top-0 inset-x-0 z-50 bg-background border-b border-border transition-transform duration-300 ${showNav ? "translate-y-0" : "-translate-y-full"}`}
      >
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-1" aria-label="Retrofly home">
            <Heart className="h-3.5 w-3.5 text-foreground fill-foreground" aria-hidden="true" />
            <span className="text-base font-semibold tracking-[-0.02em] text-foreground">Retrofly</span>
          </Link>
          <Button asChild variant="secondary" size="sm" className="rounded-md h-8 text-xs font-medium">
            <Link to="/login">
              Sign in
            </Link>
          </Button>
        </div>
      </nav>

      <main id="main-content" tabIndex={-1} className="focus:outline-none">
      <section className="mx-auto max-w-5xl px-6 pt-6 pb-12">
        <div className="bg-muted rounded-2xl p-10 md:p-14 flex flex-col md:flex-row md:items-center gap-10 md:gap-0">
          <div className="flex-1 min-w-0">
            <BlurFade delay={0}>
              <div className="flex items-center gap-1.5 mb-6">
                <Heart className="h-4.5 w-4.5 text-foreground fill-foreground" />
                <span className="text-lg font-semibold tracking-[-0.02em] text-foreground">Retrofly</span>
              </div>
            </BlurFade>
            <BlurFade delay={0.05}>
              <h1 className="text-[clamp(2.25rem,5vw,3.5rem)] font-bold text-foreground leading-[1.02] tracking-[-0.04em]">
                Better retros,<br />fewer meetings.
              </h1>
            </BlurFade>
            <p className="sr-only">
              Retrofly is an async retrospective workspace for collecting team feedback, finding themes, and tracking action items after each retro.
            </p>
            <BlurFade delay={0.1}>
              <p className="mt-5 text-lg text-muted-foreground max-w-md leading-relaxed">
                Your team reflects async. AI surfaces the themes. You ship the improvements.
              </p>
            </BlurFade>
            <BlurFade delay={0.15}>
              <div className="mt-8">
                <Button asChild size="lg" className="rounded-md h-11 px-6 text-sm font-medium gap-2">
                  <Link to="/login">
                    Start a retro <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </BlurFade>
          </div>
          <div className="flex-shrink-0 w-full md:w-[420px] mix-blend-multiply dark:mix-blend-normal dark:opacity-95">
            <img
              src={heroIllustration}
              alt="Team collaborating on a retrospective"
              className="w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* Section 2 - Feature blocks */}
      <section className="mx-auto max-w-5xl px-6 pt-14 pb-20">
        <BlurFade delay={0} inView>
          <p className="text-sm font-medium text-muted-foreground mb-3">How it works</p>
          <h2 className="text-3xl font-bold tracking-[-0.04em] leading-[1.1] text-foreground mb-6">
            Three steps. No scheduling required.
          </h2>
        </BlurFade>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: MessageSquare,
              title: "Collect feedback",
              desc: "Your team adds cards async - what went well, what didn't, what to try next.",
              headerBg: "bg-amber-200 dark:bg-amber-900/60",
              cardBg: "bg-amber-50 dark:bg-amber-950/30",
              border: "border-amber-200/60 dark:border-amber-900/40",
            },
            {
              icon: Brain,
              title: "AI finds patterns",
              desc: "Responses are grouped by theme and summarised automatically. No facilitator needed.",
              headerBg: "bg-blue-200 dark:bg-blue-900/60",
              cardBg: "bg-blue-50 dark:bg-blue-950/30",
              border: "border-blue-200/60 dark:border-blue-900/40",
            },
            {
              icon: CheckCircle2,
              title: "Track action items",
              desc: "Turn insights into tasks with owners and due dates. Close the feedback loop.",
              headerBg: "bg-emerald-200 dark:bg-emerald-900/60",
              cardBg: "bg-emerald-50 dark:bg-emerald-950/30",
              border: "border-emerald-200/60 dark:border-emerald-900/40",
            },
          ].map((item, i) => (
            <BlurFade key={item.title} delay={0.05 * i} inView>
              <div className={`${item.cardBg} rounded-xl border ${item.border} h-full flex flex-col overflow-hidden`}>
                <div className={`${item.headerBg} h-16 relative`}>
                  <div className="absolute -bottom-5 left-6 w-10 h-10 rounded-lg bg-background dark:bg-card border border-border/40 flex items-center justify-center shadow-sm">
                    <item.icon className="w-[18px] h-[18px] text-foreground" />
                  </div>
                </div>
                <div className={`${item.cardBg} p-7 pt-9 flex-1`}>
                  <h3 className="text-lg font-semibold text-foreground mb-2 tracking-[-0.02em]">{item.title}</h3>
                  <p className="text-[15px] text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </BlurFade>
          ))}
        </div>
      </section>

      {/* Section 3 - Inverted */}
      <section className="bg-neutral-900 text-neutral-100">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <BlurFade delay={0} inView>
            <p className="text-sm font-medium text-neutral-400 mb-3">Built for real teams</p>
            <h2 className="text-3xl font-bold tracking-[-0.04em] leading-[1.1] text-neutral-100 mb-12">
              Everything you'd expect. Nothing you don't need.
            </h2>
          </BlurFade>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
            {[
              {
                icon: Users,
                title: "Real-time collaboration",
                desc: "Responses appear live. Upvote and comment without waiting for a sync.",
              },
              {
                icon: Layers,
                title: "Custom formats",
                desc: "Start/Stop/Continue, 4Ls, custom questions - pick what fits your team.",
              },
              {
                icon: Zap,
                title: "AI summaries",
                desc: "One click to extract themes, sentiment, and key takeaways from all feedback.",
              },
              {
                icon: Brain,
                title: "Auto-grouping",
                desc: "Similar cards are clustered automatically so you can spot patterns faster.",
              },
            ].map((item, i) => (
              <BlurFade key={item.title} delay={0.05 * i} inView>
                <div className="flex gap-4">
                  <div className="w-9 h-9 rounded-md bg-neutral-800 border border-neutral-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <item.icon className="w-4 h-4 text-neutral-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-100 mb-1 tracking-[-0.01em]">{item.title}</h3>
                    <p className="text-sm text-neutral-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4 - CTA */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <BlurFade delay={0} inView>
          <div className="flex flex-col items-center text-center gap-6">
            <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.04em] leading-[1.1] text-foreground">
              Run your first retro<br />in under a minute.
            </h2>
            <p className="text-muted-foreground max-w-md">
              Sign in with Google, create a board, and share the link with your team. That's it.
            </p>
            <Button asChild size="lg" className="rounded-md h-11 px-6 text-sm font-medium gap-2">
              <Link to="/login">
                Get started <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </BlurFade>
      </section>
      </main>

      <footer className="mx-auto max-w-5xl px-6 pb-12">
        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center sm:justify-between gap-3 sm:gap-0">
          <Link to="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors" aria-label="Retrofly home">
            <Heart className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
            <span className="text-sm font-semibold tracking-[-0.02em]">Retrofly</span>
          </Link>
          <span className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Retrofly · Built for better retros
          </span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
