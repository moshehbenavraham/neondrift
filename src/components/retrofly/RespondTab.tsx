import { useRetroQuestions } from "@/hooks/useRetros";
import { useResponses } from "@/hooks/useResponses";
import { useUpvotes } from "@/hooks/useUpvotes";
import type { Retro } from "@/hooks/useRetros";
import ResponseCard from "@/components/retrofly/ResponseCard";
import AddResponseForm from "@/components/retrofly/AddResponseForm";
import Top3Form from "@/components/retrofly/Top3Form";
import Top3Display from "@/components/retrofly/Top3Display";
import ErrorState from "@/components/retrofly/ErrorState";
import { SkeletonResponseCard } from "@/components/retrofly/skeletons";
import { Badge } from "@/components/ui/badge";
import { AnimatePresence } from "framer-motion";

const ACCENT_COLORS = [
  "border-l-[hsl(174,100%,40%)]",   // teal
  "border-l-[hsl(263,70%,58%)]",     // purple
  "border-l-[hsl(340,82%,73%)]",     // pink
  "border-l-[hsl(45,100%,65%)]",     // yellow
  "border-l-[hsl(217,100%,65%)]",    // blue
];

interface RespondTabProps {
  retro: Retro;
}

const RespondTab = ({ retro }: RespondTabProps) => {
  const { questions, loading: questionsLoading } = useRetroQuestions(retro.id);
  const { responses, loading: responsesLoading, error, refetch } = useResponses(retro.id);
  const { getUpvoteInfo } = useUpvotes(retro.id);

  const isClosed = retro.status === "closed";
  const loading = questionsLoading || responsesLoading;

  if (error) {
    return <ErrorState message="Failed to load responses" onRetry={() => refetch()} />;
  }

  if (loading) {
    return (
      <div className="space-y-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <div className="h-6 w-48 rounded bg-muted animate-pulse" />
            {[1, 2, 3].map((j) => (
              <SkeletonResponseCard key={j} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {questions.map((question, idx) => {
        const questionResponses = responses.filter(
          (r) => r.question_id === question.id
        );
        const accentClass = ACCENT_COLORS[idx % ACCENT_COLORS.length];

        return (
          <section
            key={question.id}
            className={`border-l-4 ${accentClass} pl-4 space-y-4`}
          >
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">
                {question.question_text}
              </h3>
              <Badge variant="secondary" className="rounded-full text-xs">
                {questionResponses.length}
              </Badge>
            </div>

            {questionResponses.length === 0 && (
              <p className="text-sm text-muted-foreground py-2">
                No responses yet — be the first! ✨
              </p>
            )}

            <AnimatePresence>
              {questionResponses.map((response) => (
                <ResponseCard
                  key={response.id}
                  response={response}
                  isClosed={isClosed}
                  upvoteInfo={getUpvoteInfo(response.id)}
                />
              ))}
            </AnimatePresence>

            <AddResponseForm
              retroId={retro.id}
              questionId={question.id}
              isClosed={isClosed}
            />
          </section>
        );
      })}

      <Top3Form retroId={retro.id} isClosed={isClosed} />
      <Top3Display retroId={retro.id} />
    </div>
  );
};

export default RespondTab;
