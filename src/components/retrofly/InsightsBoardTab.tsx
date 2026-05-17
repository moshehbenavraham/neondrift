import { useRetroQuestions } from "@/hooks/useRetros";
import { useResponses } from "@/hooks/useResponses";
import { useUpvotes } from "@/hooks/useUpvotes";
import type { Retro } from "@/hooks/useRetros";
import InsightCard from "@/components/retrofly/InsightCard";
import EmptyState from "@/components/retrofly/EmptyState";
import ErrorState from "@/components/retrofly/ErrorState";
import { SkeletonResponseCard } from "@/components/retrofly/skeletons";
import { Badge } from "@/components/ui/badge";

const ACCENT_COLORS = [
  "border-l-[hsl(174,100%,40%)]",
  "border-l-[hsl(263,70%,58%)]",
  "border-l-[hsl(340,82%,73%)]",
  "border-l-[hsl(45,100%,65%)]",
  "border-l-[hsl(217,100%,65%)]",
];

interface InsightsBoardTabProps {
  retro: Retro;
}

const InsightsBoardTab = ({ retro }: InsightsBoardTabProps) => {
  const { questions, loading: qLoading } = useRetroQuestions(retro.id);
  const { responses, loading: rLoading, error, refetch } = useResponses(retro.id);
  const { getUpvoteInfo, loading: uLoading } = useUpvotes(retro.id);

  const isClosed = retro.status === "closed";
  const loading = qLoading || rLoading || uLoading;

  if (error) {
    return <ErrorState message="Failed to load insights" onRetry={() => refetch()} />;
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <div className="h-6 w-32 rounded bg-muted animate-pulse" />
            <SkeletonResponseCard />
            <SkeletonResponseCard />
          </div>
        ))}
      </div>
    );
  }

  if (responses.length === 0) {
    return (
      <EmptyState
        emoji="💡"
        title="No responses yet"
        description="Head to the Respond tab to get started!"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-x-auto">
      {questions.map((question, idx) => {
        const qResponses = responses
          .filter((r) => r.question_id === question.id)
          .sort((a, b) => {
            const aCount = getUpvoteInfo(a.id).count;
            const bCount = getUpvoteInfo(b.id).count;
            return bCount - aCount;
          });

        const accentClass = ACCENT_COLORS[idx % ACCENT_COLORS.length];

        return (
          <section key={question.id} className={`border-l-4 ${accentClass} pl-3 space-y-3`}>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground line-clamp-2">
                {question.question_text}
              </h3>
              <Badge variant="secondary" className="rounded-full text-xs flex-shrink-0">
                {qResponses.length}
              </Badge>
            </div>

            {qResponses.length === 0 && (
              <p className="text-xs text-muted-foreground py-2">No responses</p>
            )}

            {qResponses.map((response) => (
              <InsightCard
                key={response.id}
                response={response}
                upvoteInfo={getUpvoteInfo(response.id)}
                isClosed={isClosed}
              />
            ))}
          </section>
        );
      })}
    </div>
  );
};

export default InsightsBoardTab;
