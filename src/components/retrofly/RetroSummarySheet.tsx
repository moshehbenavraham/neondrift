import { Sparkles, Loader2, TrendingUp, TrendingDown, Lightbulb, Tag, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useRetroSummary, type RetroSummary } from "@/hooks/useRetroSummary";

interface RetroSummarySheetProps {
  retroId: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SectionTitle = ({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) => (
  <h3 className="flex items-center gap-2 text-sm font-semibold text-white/90 mb-2">
    <Icon className="h-4 w-4 text-brand-saffron" />
    {children}
  </h3>
);

const SummaryContent = ({ summary }: { summary: RetroSummary }) => (
  <div className="space-y-6">
    {/* One-line takeaway */}
    <div className="rounded-xl bg-white/[0.06] border border-white/10 p-4">
      <div className="flex items-start gap-2">
        <Quote className="h-4 w-4 text-brand-saffron mt-0.5 flex-shrink-0" />
        <p className="text-sm font-medium text-white/90 italic">{summary.one_line_takeaway}</p>
      </div>
    </div>

    {/* Overall Sentiment */}
    <div>
      <SectionTitle icon={TrendingUp}>Overall Sentiment</SectionTitle>
      <p className="text-sm text-white/70 leading-relaxed">{summary.overall_sentiment}</p>
    </div>

    {/* Key Themes */}
    <div>
      <SectionTitle icon={Tag}>Key Themes</SectionTitle>
      <div className="space-y-3">
        {summary.key_themes.map((theme, i) => (
          <div key={i} className="rounded-lg bg-white/[0.04] border border-white/10 p-3">
            <p className="text-sm font-medium text-white/90 mb-1">{theme.title}</p>
            <p className="text-xs text-white/60 mb-2">{theme.description}</p>
            <div className="flex flex-wrap gap-1">
              {theme.categories.map((cat, j) => (
                <Badge key={j} variant="secondary" className="text-[10px] rounded-full bg-white/10 text-white/60 border-0">
                  {cat}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Top Highlights */}
    {summary.top_highlights.length > 0 && (
      <div>
        <SectionTitle icon={TrendingUp}>Top Highlights</SectionTitle>
        <ul className="space-y-1.5">
          {summary.top_highlights.map((h, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-white/70">
              <span className="text-emerald-400 mt-0.5">✓</span>
              {h}
            </li>
          ))}
        </ul>
      </div>
    )}

    {/* Top Concerns */}
    {summary.top_concerns.length > 0 && (
      <div>
        <SectionTitle icon={TrendingDown}>Top Concerns</SectionTitle>
        <ul className="space-y-1.5">
          {summary.top_concerns.map((c, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-white/70">
              <span className="text-amber-400 mt-0.5">⚠</span>
              {c}
            </li>
          ))}
        </ul>
      </div>
    )}

    {/* Suggested Actions */}
    {summary.suggested_actions.length > 0 && (
      <div>
        <SectionTitle icon={Lightbulb}>Suggested Actions</SectionTitle>
        <div className="space-y-2">
          {summary.suggested_actions.map((sa, i) => (
            <div key={i} className="rounded-lg bg-white/[0.04] border border-white/10 p-3">
              <p className="text-sm font-medium text-white/90 mb-1">{sa.action}</p>
              <p className="text-xs text-white/50">{sa.rationale}</p>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

const RetroSummarySheet = ({ retroId, open, onOpenChange }: RetroSummarySheetProps) => {
  const { summary, loading, error, generate } = useRetroSummary(retroId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-saffron" />
            AI Summary
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4">
          {!summary && !loading && (
            <div className="text-center py-12 space-y-4">
              <Sparkles className="h-10 w-10 mx-auto text-white/20" />
              <div>
                <p className="text-sm text-white/60 mb-1">
                  Generate an AI-powered analysis of this retro's responses, themes, and action items.
                </p>
                <p className="text-xs text-white/40">
                  Works best with several responses already submitted.
                </p>
              </div>
              <Button onClick={generate} className="rounded-full gap-2">
                <Sparkles className="h-4 w-4" />
                Generate Summary
              </Button>
              {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-brand-saffron" />
              <p className="text-sm text-white/50">Analyzing retro data…</p>
            </div>
          )}

          {summary && !loading && (
            <div>
              <SummaryContent summary={summary} />
              <div className="mt-6 pt-4 border-t border-white/10">
                <Button variant="ghost" size="sm" className="rounded-full gap-2 text-white/50 hover:text-white" onClick={generate}>
                  <Sparkles className="h-3.5 w-3.5" />
                  Regenerate
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RetroSummarySheet;
